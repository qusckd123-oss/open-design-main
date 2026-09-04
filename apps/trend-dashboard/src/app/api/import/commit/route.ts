import { NextResponse } from "next/server";
import { parseImportFile, parsePastedTable } from "@/services/import-file-service";
import { importRows } from "@/services/import-service";
import type { ImportType } from "@/config/import-mapping";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = String(formData.get("type") ?? "SALES") as ImportType;
    const source = String(formData.get("source") ?? "");
    const dataDate = String(formData.get("dataDate") ?? "");
    const pasted = String(formData.get("pasted") ?? "");
    const mappingValue = String(formData.get("mapping") ?? "{}");
    const file = formData.get("file");
    if (type !== "SALES" && type !== "MARKET") return NextResponse.json({ error: "지원하지 않는 import type입니다." }, { status: 400 });
    const mapping = JSON.parse(mappingValue) as Record<string, string>;
    const parsed = pasted.trim() ? parsePastedTable(pasted) : file instanceof File ? await parseImportFile(file.name, await file.arrayBuffer()) : null;
    if (!parsed) return NextResponse.json({ error: "파일 또는 붙여넣은 표가 필요합니다." }, { status: 400 });
    const result = await importRows({
      type,
      source: source || (type === "SALES" ? "INTERNAL" : "MANUAL_IMPORT"),
      fileName: file instanceof File ? file.name : "pasted-table",
      dataMode: "import",
      rows: parsed.rows,
      mapping,
      defaultSource: source,
      defaultPeriodDate: dataDate
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Import 실패" }, { status: 400 });
  }
}
