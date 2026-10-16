import { MAX_LOOK_IMAGE_BYTES, sniffImage } from "./look-image-fetch";

export const UPLOAD_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ValidatedUpload = { bytes: Buffer; contentType: (typeof UPLOAD_ACCEPTED_TYPES)[number]; extension: "jpg" | "png" | "webp" };

/**
 * Validates an uploaded image from its bytes. The filename is never used; the extension and Content-Type
 * come from the magic bytes, and a claimed MIME that disagrees with them is rejected.
 */
export function validateUploadedImage(bytes: Buffer, claimedMime: string): ValidatedUpload {
  if (!bytes.length) throw new Error("빈 파일은 업로드할 수 없습니다.");
  if (bytes.length > MAX_LOOK_IMAGE_BYTES) throw new Error("이미지 용량이 15MB 한도를 초과했습니다.");
  const claimed = claimedMime.split(";")[0]!.trim().toLowerCase();
  if (!(UPLOAD_ACCEPTED_TYPES as readonly string[]).includes(claimed)) throw new Error("JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.");
  const sniffed = sniffImage(bytes);
  if (!sniffed || !(UPLOAD_ACCEPTED_TYPES as readonly string[]).includes(sniffed.contentType)) throw new Error("파일 내용이 JPEG, PNG, WebP 이미지가 아닙니다.");
  if (sniffed.contentType !== claimed) throw new Error("파일 형식 정보와 실제 내용이 일치하지 않습니다.");
  return { bytes, contentType: sniffed.contentType as ValidatedUpload["contentType"], extension: sniffed.extension as ValidatedUpload["extension"] };
}
