import { createHash } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
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

export function lookImageKey(input: { sourceAccountId: string; postIdentity: string; imageIndex: number; bytes: Buffer; extension: string }): string {
  const digest = createHash("sha256").update(input.bytes).digest("hex").slice(0, 16);
  const post = `${slug(input.postIdentity)}-${createHash("sha256").update(input.postIdentity).digest("hex").slice(0, 8)}`;
  return `look-observations/${slug(input.sourceAccountId)}/${post}/${input.imageIndex}-${digest}.${input.extension}`;
}

type NativeR2Bucket = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }
  ): Promise<unknown>;
  delete(key: string): Promise<unknown>;
};

type LookImageCloudflareEnv = {
  LOOK_IMAGES?: NativeR2Bucket;
};

function getLookImagesBucket(): NativeR2Bucket {
  const { env } = getCloudflareContext();
  const bucket = (env as unknown as LookImageCloudflareEnv).LOOK_IMAGES;
  if (!bucket) throw new Error("이미지 저장소(R2) 바인딩이 완료되지 않아 관측을 저장할 수 없습니다.");
  return bucket;
}

/**
 * Cloudflare Worker storage path.
 *
 * Use a native R2 binding instead of the S3-compatible HTTP endpoint. The
 * latter relies on the Node AWS SDK's connection lifecycle, which can leave
 * OpenNext Worker requests pending even after the request work is finished.
 */
export function getR2LookImageStore(env: Record<string, string | undefined> = process.env): LookImageStore {
  const base = env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("이미지 저장소(R2) 공개 URL 설정이 완료되지 않아 관측을 저장할 수 없습니다.");
  const publicBase = base.replace(/\/+$/, "");
  if (!/^https:\/\//.test(publicBase)) throw new Error("R2_PUBLIC_BASE_URL은 https URL이어야 합니다.");
  const bucket = getLookImagesBucket();

  return {
    async put(key, body, contentType) {
      await bucket.put(key, body, {
        httpMetadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable"
        }
      });
    },
    async delete(key) {
      await bucket.delete(key);
    },
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

export async function storeLookImage(input: StoreLookImageInput, store: LookImageStore, fetchOptions: FetchSourceImageOptions = {}): Promise<StoredLookImage> {
  const image = await fetchSourceImage(input.sourceUrl, { platform: input.platform, ...fetchOptions });
  const key = lookImageKey({ ...input, bytes: image.bytes, extension: image.extension });
  try {
    await store.put(key, image.bytes, image.contentType);
  } catch {
    throw new Error("이미지 저장소에 업로드하지 못했습니다.");
  }
  return { key, url: store.publicUrl(key), contentType: image.contentType, bytes: image.bytes.length };
}
