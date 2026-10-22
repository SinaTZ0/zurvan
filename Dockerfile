FROM node:24-alpine AS development-dependencies-env
WORKDIR /app
COPY ./package.json package-lock.json ./
RUN npm ci
COPY . .

FROM development-dependencies-env AS build-env
RUN npm run build

# Nitro's output is self-contained: the server bundle plus the few traced native dependencies (sharp) in
# .output/server/node_modules, so the runtime needs no npm install.
FROM node:24-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --chown=node:node --from=build-env /app/.output /app/.output
WORKDIR /app
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
