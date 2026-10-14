import { setTimeout } from "node:timers/promises";

import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET_NAME;
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY, secretAccessKey: process.env.S3_SECRET_KEY },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

// The master/filer can be healthy a few seconds before the S3 gateway is ready.
try {
  for (let attempt = 1; ; attempt++) {
    try {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        if (error.$metadata?.httpStatusCode !== 404) throw error;
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (createError) {
          if (createError.name !== "BucketAlreadyOwnedByYou") throw createError;
        }
      }
      console.log(`Media bucket ${bucket} is ready.`);
      break;
    } catch (error) {
      if (attempt >= 30) throw error;
      await setTimeout(2000);
    }
  }
} finally {
  client.destroy();
}
