import * as XLSX from "xlsx";
import { fieldsForType, type ImportType, suggestColumnMapping } from "@/config/import-mapping";

export type ParsedTable = {
  columns: string[];
  rows: Record<string, string>[];
};

export async function parseImportFile(fileName: string, buffer: ArrayBuffer): Promise<ParsedTable> {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "csv") return parseCsv(new TextDecoder("utf-8").decode(buffer));
  if (extension === "xlsx" || extension === "xls") return parseWorkbook(buffer);
  throw new Error("지원하지 않는 파일 형식입니다. .csv, .xlsx, .xls 파일만 업로드할 수 있습니다.");
}

export function parsePastedTable(input: string): ParsedTable {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
  const delimiter = input.includes("\t") ? "\t" : ",";
  const matrix = lines.map((line) => line.split(delimiter).map((cell) => cell.trim()));
  return matrixToTable(matrix);
}

export function buildImportPreview(type: ImportType, parsed: ParsedTable) {
  const mapping = suggestColumnMapping(type, parsed.columns);
  return {
    columns: parsed.columns,
    rows: parsed.rows.slice(0, 20),
    mapping,
    mappedFields: Object.values(mapping).filter(Boolean).length,
    unmappedFields: Object.entries(mapping).filter(([, column]) => !column).map(([field]) => field),
    duplicateCandidates: countDuplicateCandidates(type, parsed.rows, mapping),
    fields: fieldsForType(type),
    totalRows: parsed.rows.length
  };
}

function parseWorkbook(buffer: ArrayBuffer): ParsedTable {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("워크북에 시트가 없습니다.");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("첫 번째 시트를 읽을 수 없습니다.");
  const matrix = XLSX.utils.sheet_to_json<Array<string | number | Date | null>>(sheet, { header: 1, defval: "" });
  return matrixToTable(matrix);
}

function parseCsv(input: string): ParsedTable {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === "\"" && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return matrixToTable(rows);
}

function matrixToTable(matrix: Array<Array<string | number | Date | null>>): ParsedTable {
  const nonEmptyRows = matrix.filter((row) => row.some((cell) => String(cell ?? "").trim().length > 0));
  const header = nonEmptyRows[0]?.map((cell) => String(cell ?? "").trim()) ?? [];
  const columns = dedupeColumns(header);
  const rows = nonEmptyRows.slice(1).map((rawRow) =>
    Object.fromEntries(columns.map((column, index) => [column, stringifyCell(rawRow[index])]))
  );
  return { columns, rows };
}

function dedupeColumns(columns: string[]) {
  const seen = new Map<string, number>();
  return columns.map((column, index) => {
    const base = column || `Column ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} ${count + 1}`;
  });
}

function stringifyCell(value: string | number | Date | null | undefined) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "").trim();
}

function countDuplicateCandidates(type: ImportType, rows: Record<string, string>[], mapping: Record<string, string>) {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const sourceColumn = mapping.source;
    const externalIdColumn = mapping.externalProductId;
    const urlColumn = mapping.url;
    const periodColumn = mapping.periodDate;
    const productCodeColumn = mapping.productCode;
    const key =
      type === "MARKET"
        ? [sourceColumn ? row[sourceColumn] ?? "" : "", externalIdColumn ? row[externalIdColumn] ?? "" : urlColumn ? row[urlColumn] ?? "" : "", periodColumn ? row[periodColumn] ?? "" : ""].join("|")
        : [productCodeColumn ? row[productCodeColumn] ?? "" : "", periodColumn ? row[periodColumn] ?? "" : ""].join("|");
    if (!key.replace(/\|/g, "")) continue;
    if (seen.has(key)) duplicates += 1;
    seen.add(key);
  }
  return duplicates;
}
