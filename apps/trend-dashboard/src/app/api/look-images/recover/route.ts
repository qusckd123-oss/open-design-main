import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { MAX_LOOK_IMAGE_BYTES } from "@/lib/look-image-fetch";
import { lookMutationError, recoverLookObservationStoredImageFromFile } from "@/services/look-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// multipart overhead on top of the 15 MB image cap
const MAX_REQUEST_BYTES = MAX_LOOK_IMAGE_BYTES + 64 * 1024;

function fail(message: string, status: number) { return NextResponse.json({ ok: false, message }, { status }); }

/** Legacy LOOK image recovery from an uploaded file (multipart/form-data: observationId + file). */
export async function POST(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value)) return fail("로그인이 필요합니다.", 401);
  const length = Number(request.headers.get("content-length"));
  if (!Number.isFinite(length) || length <= 0) return fail("업로드 크기를 확인할 수 없습니다.", 411);
  if (length > MAX_REQUEST_BYTES) return fail("이미지 용량이 15MB 한도를 초과했습니다.", 413);
  let form: FormData;
  try { form = await request.formData(); } catch { return fail("업로드 형식이 올바르지 않습니다.", 400); }
  const observationId = form.get("observationId");
  const file = form.get("file");
  if (typeof observationId !== "string" || !(file instanceof File)) return fail("관측 ID와 이미지 파일이 필요합니다.", 400);
  if (file.size > MAX_LOOK_IMAGE_BYTES) return fail("이미지 용량이 15MB 한도를 초과했습니다.", 413);
  try {
    await recoverLookObservationStoredImageFromFile(observationId, { bytes: Buffer.from(await file.arrayBuffer()), mime: file.type });
  } catch (error) {
    return fail(lookMutationError(error), 400);
  }
  revalidatePath("/research/looks");
  revalidatePath("/");
  return NextResponse.json({ ok: true, message: "영구 이미지를 복구했습니다." });
}
