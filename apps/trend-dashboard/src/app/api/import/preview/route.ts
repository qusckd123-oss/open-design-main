import { NextResponse } from "next/server";
import { buildImportPreview, parseImportFile, parsePastedTable } from "@/services/import-file-service";
import type { ImportType } from "@/config/import-mapping";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = String(formData.get("type") ?? "SALES") as ImportType;
    const pasted = String(formData.get("pasted") ?? "");
    const file = formData.get("file");
    if (type !== "SALES" && type !== "MARKET") return NextResponse.json({ error: "지원하지 않는 import type입니다." }, { status: 400 });
    const parsed = pasted.trim() ? parsePastedTable(pasted) : file instanceof File ? await parseImportFile(file.name, await file.arrayBuffer()) : null;
    if (!parsed) return NextResponse.json({ error: "파일 또는 붙여넣은 표가 필요합니다." }, { status: 400 });
    return NextResponse.json(buildImportPreview(type, parsed));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Preview 생성 실패" }, { status: 400 });
  }
}
