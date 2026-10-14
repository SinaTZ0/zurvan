FROM node:24-alpine AS development-dependencies-env
WORKDIR /app
COPY ./package.json package-lock.json ./
RUN npm ci
COPY . .

FROM node:24-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev

FROM development-dependencies-env AS build-env
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --chown=node:node ./package.json package-lock.json /app/
COPY --chown=node:node --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --chown=node:node --from=build-env /app/build /app/build
WORKDIR /app
USER node
EXPOSE 3000
CMD ["node", "node_modules/@react-router/serve/dist/cli.js", "./build/server/index.js"]
