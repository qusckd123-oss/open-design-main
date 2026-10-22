import type { FetchSourceImageOptions } from "./look-image-fetch";
import { lookImageKey, storeLookImage, type LookImageStore, type StoredLookImage } from "@/lib/look-image-storage";
import { validateUploadedImage } from "./look-image-upload";
import type { LookPlatformCode } from "./look-observation";

export type IsKeyReferenced = (keys: string[]) => Promise<Set<string>>;
export type StoredBatchImage = StoredLookImage & { imageUrl: string; imageIndex: number };

/** Delete uploaded objects, but never an object some DB row already references (keys are content-addressed). */
export async function cleanupUnreferencedObjects(keys: string[], store: LookImageStore, isReferenced: IsKeyReferenced): Promise<void> {
  if (!keys.length) return;
  let referenced = new Set<string>();
  try { referenced = await isReferenced(keys); } catch { return; /* cannot prove it is an orphan: keep it */ }
  await Promise.allSettled(keys.filter((key) => !referenced.has(key)).map((key) => store.delete(key)));
}

/** All-or-nothing: if any image fails, objects uploaded by this call are removed and the error is rethrown. */
export async function storeLookImageBatch(
  images: Array<{ imageUrl: string; imageIndex: number }>,
  context: { platform: LookPlatformCode; sourceAccountId: string; postIdentity: string },
  store: LookImageStore,
  isReferenced: IsKeyReferenced,
  fetchOptions: FetchSourceImageOptions = {}
): Promise<StoredBatchImage[]> {
  const stored: StoredBatchImage[] = [];
  try {
    for (const image of images) {
      const result = await storeLookImage({ sourceUrl: image.imageUrl, imageIndex: image.imageIndex, ...context }, store, fetchOptions);
      stored.push({ ...result, imageUrl: image.imageUrl, imageIndex: image.imageIndex });
    }
    return stored;
  } catch (error) {
    await cleanupUnreferencedObjects(stored.map((row) => row.key), store, isReferenced);
    throw error;
  }
}

export type RecoverableObservation = {
  id: string; platform: LookPlatformCode; postIdentity: string; imageIndex: number; sourceAccountId: string; storedImageKey: string | null;
};
export type LookImageRecoveryDb = {
  find(id: string): Promise<RecoverableObservation | null>;
  /** Must update ONLY the stored* columns, and only while storedImageKey is still NULL. Returns affected rows. */
  setStoredImage(id: string, data: { storedImageKey: string; storedImageUrl: string; storedImageAt: Date }): Promise<number>;
  isReferenced: IsKeyReferenced;
};

/** Image recovery for an existing observation. Touches no review/provenance field and creates no rows. */
export async function recoverLookObservationImage(
  db: LookImageRecoveryDb, store: LookImageStore, observationId: string, sourceUrl: string, fetchOptions: FetchSourceImageOptions = {}
): Promise<StoredLookImage> {
  const row = await db.find(observationId);
  if (!row) throw new Error("관측을 찾을 수 없습니다.");
  if (row.storedImageKey) throw new Error("이미 영구 저장된 이미지가 있는 관측입니다.");
  const stored = await storeLookImage({ sourceUrl, platform: row.platform, sourceAccountId: row.sourceAccountId, postIdentity: row.postIdentity, imageIndex: row.imageIndex }, store, fetchOptions);
  let count = 0;
  try { count = await db.setStoredImage(row.id, { storedImageKey: stored.key, storedImageUrl: stored.url, storedImageAt: new Date() }); }
  catch (error) { await cleanupUnreferencedObjects([stored.key], store, db.isReferenced); throw error; }
  if (count !== 1) {
    await cleanupUnreferencedObjects([stored.key], store, db.isReferenced);
    throw new Error("이미지 복구 대상이 이미 변경되었습니다. 새로고침 후 다시 확인하세요.");
  }
  return stored;
}

/**
 * Recovery from an uploaded image file (no server-side fetch of the source CDN).
 * Order: validate -> find row -> upload R2 -> update only stored* columns; failures clean up the new object.
 */
export async function recoverLookObservationImageFromFile(
  db: LookImageRecoveryDb, store: LookImageStore, observationId: string, file: { bytes: Buffer; mime: string }
): Promise<StoredLookImage> {
  const image = validateUploadedImage(file.bytes, file.mime);
  const row = await db.find(observationId);
  if (!row) throw new Error("관측을 찾을 수 없습니다.");
  if (row.storedImageKey) throw new Error("이미 영구 저장된 이미지가 있는 관측입니다.");
  const key = lookImageKey({ sourceAccountId: row.sourceAccountId, postIdentity: row.postIdentity, imageIndex: row.imageIndex, bytes: image.bytes, extension: image.extension });
  try { await store.put(key, image.bytes, image.contentType); }
  catch { throw new Error("이미지 저장소에 업로드하지 못했습니다."); }
  const stored: StoredLookImage = { key, url: store.publicUrl(key), contentType: image.contentType, bytes: image.bytes.length };
  let count = 0;
  try { count = await db.setStoredImage(row.id, { storedImageKey: stored.key, storedImageUrl: stored.url, storedImageAt: new Date() }); }
  catch (error) { await cleanupUnreferencedObjects([stored.key], store, db.isReferenced); throw error; }
  if (count !== 1) {
    await cleanupUnreferencedObjects([stored.key], store, db.isReferenced);
    throw new Error("이미지 복구 대상이 이미 변경되었습니다. 새로고침 후 다시 확인하세요.");
  }
  return stored;
}

/** Row data for a new post: original source URL kept as provenance + durable stored reference. */
export function buildLookObservationRows<T extends Record<string, unknown>>(base: T, stored: StoredBatchImage[]) {
  return stored.map((image) => ({
    ...base, imageUrl: image.imageUrl, imageIndex: image.imageIndex,
    storedImageKey: image.key, storedImageUrl: image.url, storedImageAt: new Date()
  }));
}
