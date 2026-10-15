import { createHash } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fetchSourceImage, type FetchSourceImageOptions } from "./look-image-fetch";
import type { LookPlatformCode } from "./look-observation";

export type LookImageStore = {
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
};

export type StoredLookImage = { key: string; url: string; contentType: string; bytes: number };

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "x";
}

/** Deterministic, collision-safe key: same bytes at same slot -> same key; different bytes -> different key. */
export function lookImageKey(input: { sourceAccountId: string; postIdentity: string; imageIndex: number; bytes: Buffer; extension: string }): string {
  const digest = createHash("sha256").update(input.bytes).digest("hex").slice(0, 16);
  // Instagram shortcodes are case-sensitive, so a hash of the raw identity keeps lower-cased slugs collision-safe.
  const post = `${slug(input.postIdentity)}-${createHash("sha256").update(input.postIdentity).digest("hex").slice(0, 8)}`;
  return `look-observations/${slug(input.sourceAccountId)}/${post}/${input.imageIndex}-${digest}.${input.extension}`;
}

/** Server-side only. Missing configuration fails closed so no row is ever created without a durable copy. */
export function getR2LookImageStore(env: Record<string, string | undefined> = process.env): LookImageStore {
  const { R2_ACCOUNT_ID: account, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET_NAME: bucket, R2_PUBLIC_BASE_URL: base } = env;
  if (!account || !accessKeyId || !secretAccessKey || !bucket || !base) {
    throw new Error("이미지 저장소(R2) 설정이 완료되지 않아 관측을 저장할 수 없습니다.");
  }
  const publicBase = base.replace(/\/+$/, "");
  if (!/^https:\/\//.test(publicBase)) throw new Error("R2_PUBLIC_BASE_URL은 https URL이어야 합니다.");
  const client = new S3Client({ region: "auto", endpoint: `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey } });
  return {
    async put(key, body, contentType) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
    },
    async delete(key) { await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); },
    publicUrl: (key) => `${publicBase}/${key.split("/").map(encodeURIComponent).join("/")}`
  };
}

export type StoreLookImageInput = {
  sourceUrl: string;
  platform: LookPlatformCode;
  sourceAccountId: string;
  postIdentity: string;
  imageIndex: number;
};

/** Fetch a temporary source image and copy it to durable storage. Never logs URLs with credentials or secrets. */
export async function storeLookImage(input: StoreLookImageInput, store: LookImageStore, fetchOptions: FetchSourceImageOptions = {}): Promise<StoredLookImage> {
  const image = await fetchSourceImage(input.sourceUrl, { platform: input.platform, ...fetchOptions });
  const key = lookImageKey({ ...input, bytes: image.bytes, extension: image.extension });
  try { await store.put(key, image.bytes, image.contentType); }
  catch { throw new Error("이미지 저장소에 업로드하지 못했습니다."); }
  return { key, url: store.publicUrl(key), contentType: image.contentType, bytes: image.bytes.length };
}
