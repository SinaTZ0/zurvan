# Media (Images)

How the app stores, processes and serves images: avatars, pet photos, course covers and trainer certificates.

## Overview

```text
upload:  browser ──multipart──▶ React Router (oRPC) ──sharp──▶ WebP variants ──S3 PUT──▶ SeaweedFS (bucket zurvann)
serve:   browser ──GET /media/…──▶ nginx ──▶ SeaweedFS S3 (read-only, files only)
```

- **SeaweedFS** stores the files in the `zurvann` bucket and runs in the same Docker Compose project as the app. Its ports are not published in production; only nginx and the app can reach it.
- **The app writes.** Uploads go through the React Router server, which checks, converts and resizes the image, then puts every variant into the bucket with the S3 API.
- **nginx reads.** It forwards `GET` and `HEAD` requests for image files to SeaweedFS and refuses everything else. Users never write to SeaweedFS directly.
- The browser never receives the original upload. Only the generated WebP variants are stored.

## Image Kinds and Variants

Each kind of image has a fixed set of variants. Variants are generated once at upload time.

- **cover** crops to exactly the given size, keeping the most interesting part of the image (sharp's `attention` strategy).
- **inside** fits the image inside the given box and keeps its aspect ratio. It never upscales and never stretches.

| Kind          | Variant | Mode   | Size (px)   | Used for                                      |
| ------------- | ------- | ------ | ----------- | --------------------------------------------- |
| `avatar`      | `thumb` | cover  | 96 × 96     | Comment lists, tables, nav menu               |
|               | `md`    | cover  | 320 × 320   | Profile pages, trainer profile                |
| `pet`         | `thumb` | cover  | 160 × 160   | Pet pickers, pet rows, checkout               |
|               | `card`  | cover  | 800 × 600   | Pet cards and the pet detail header (4:3)     |
|               | `full`  | inside | 1600 × 1600 | Opening the photo                             |
| `course`      | `thumb` | cover  | 480 × 270   | Order lists, admin tables, small cards (16:9) |
|               | `card`  | cover  | 960 × 540   | Catalogue cards (16:9)                        |
|               | `hero`  | cover  | 1920 × 823  | Course detail header (21:9)                   |
| `certificate` | `thumb` | cover  | 320 × 240   | Certificate list on the trainer profile       |
|               | `full`  | inside | 2000 × 2000 | Opening a certificate, readable text          |

Sizes are about twice the largest CSS size each one is shown at, so they look sharp on high-density screens.

Every image also gets a **placeholder**: a 16 px wide WebP stored inline in the database as a data URI (about 200 bytes). Pages show it blurred while the real image loads, so layout doesn't jump and slow connections still see something.

## Processing Rules

All processing uses [sharp](https://sharp.pixelplumbing.com/) on the server.

1. **Limits:** at most **10 MB** per file and **40 megapixels** (`limitInputPixels`). Larger files are rejected before decoding.
2. **Check the real type:** read the format with sharp, not from the file name or the `Content-Type` header. Accept `jpeg`, `png` and `webp`. Reject everything else, including HEIC, with a Persian message asking for a JPG or PNG.
3. **Rotate** using the EXIF orientation, then **remove all metadata**. Phone photos carry GPS location, which must never be published.
4. **Convert to sRGB** and **flatten transparency** onto the app's cream background (`#FBFAF6`), except for avatars, which keep transparency.
5. **Encode WebP** at quality **80** (`thumb`: **72**) with `effort: 4`. The full-size variants stay well under 500 KB.

## Storage Keys and URLs

```text
{kind}/{mediaId}/{variant}.webp        e.g. course/7f3c…/card.webp
```

- `mediaId` is a fresh UUID for every upload. A replaced image gets a new ID, so a URL never changes content and can be cached forever (`Cache-Control: public, max-age=31536000, immutable`).
- The app builds URLs from `MEDIA_PUBLIC_URL`:
  - Development: `http://localhost:8333/zurvann` (straight to SeaweedFS, no nginx).
  - Production: `/media`.

## Database

One `media` table records every upload:

| Field       | Notes                                                           |
| ----------- | --------------------------------------------------------------- |
| ID          | The `mediaId` in the storage key.                               |
| Kind        | `avatar`, `pet`, `course`, `certificate`. Decides the variants. |
| Uploaded By | User ID.                                                        |
| Width       | Of the original after rotation, for the `full` aspect ratio.    |
| Height      |                                                                 |
| Placeholder | Data URI of the tiny blurred preview.                           |
| Attached At | Set when an entity starts using it. Empty means it's an orphan. |

Entities point to it with a nullable foreign key: `user.avatarMediaId`, `pet.photoMediaId`, `course.coverMediaId`, and a `trainer_certificate` table with `mediaId` and a title.

## Upload Flow

1. The form uploads the file as soon as it's picked, through an oRPC `media.upload` procedure (`kind` + `File`). Only signed-in users can upload, and only the kinds their role uses (customers can't upload `course`).
2. The server processes it, writes the variants to SeaweedFS, inserts the `media` row and returns its ID, URLs and placeholder. The form shows the preview right away.
3. Saving the form sends the media ID along with the other fields. The entity's service checks that the media is the right kind and was uploaded by the same user (or by an Admin), then sets `Attached At`.
4. When an image is replaced or its entity deleted, the old media is deleted from the bucket and the database.
5. **Cleanup:** a background job deletes media that is still unattached after 24 hours (forms that were never saved).

If writing a variant fails halfway, the server deletes the variants it already wrote and returns an error. A `media` row only exists when all its variants exist.

## Rendering

A shared `MediaImage` component takes the media and a variant, and renders an `<img>` with its URL, `width` and `height` (no layout shift), `loading="lazy"` (except the course `hero`) and the blurred placeholder as its background. Persian `alt` text is required.

## nginx

```nginx
# `proxy_pass` with a variable resolves the host per request, so nginx needs Docker's DNS.
resolver 127.0.0.11 valid=30s;

# Only image files: blocks bucket listing and every write method.
location ~ ^/media/([a-z]+/[0-9a-f-]{36}/[a-z]+\.webp)$ {
  limit_except GET HEAD { deny all; }
  proxy_pass http://seaweedfs:8333/zurvann/$1;
  proxy_hide_header x-amz-request-id;
  proxy_hide_header x-amz-id-2;
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location /media/ { return 404; }
```

## Configuration

| Variable           | Development                     | Docker Compose            |
| ------------------ | ------------------------------- | ------------------------- |
| `S3_ENDPOINT`      | `http://localhost:8333`         | `http://seaweedfs:8333`   |
| `S3_BUCKET`        | `zurvann`                       | `zurvann`                 |
| `S3_ACCESS_KEY`    | any (S3 auth is off locally)    | the app's identity key    |
| `S3_SECRET_KEY`    | any                             | the app's identity secret |
| `MEDIA_PUBLIC_URL` | `http://localhost:8333/zurvann` | `/media`                  |

The current local SeaweedFS (`SeaweedFS/docker-compose.yml`) runs S3 **without authentication**, which is fine on a development PC. In the project's Compose file, SeaweedFS should:

- publish no ports, so only nginx and the app reach it inside the network;
- have an S3 identity for the app (read and write on `zurvann`) and an `anonymous` identity with `Read` only, so nginx's requests still work;
- pin an image version instead of `latest`.

## Dependencies

- `sharp`: processing. It ships prebuilt binaries for `node:24-alpine`.
- `@aws-sdk/client-s3`: writes and deletes. Using the S3 API instead of SeaweedFS's own filer API means the storage can move to any S3-compatible service later without code changes.
