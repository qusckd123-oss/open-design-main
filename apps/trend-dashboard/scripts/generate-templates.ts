import * as XLSX from "xlsx";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const templates = [
  { csv: "public/templates/sales-import-template.csv", xlsx: "public/templates/sales-import-template.xlsx", sheet: "Sales Import" },
  { csv: "public/templates/market-import-template.csv", xlsx: "public/templates/market-import-template.xlsx", sheet: "Market Import" }
];

for (const template of templates) {
  const csvPath = resolve(template.csv);
  const xlsxPath = resolve(template.xlsx);
  mkdirSync(dirname(xlsxPath), { recursive: true });
  const workbook = XLSX.read(readFileSync(csvPath, "utf-8"), { type: "string" });
  workbook.SheetNames[0] = template.sheet;
  XLSX.writeFile(workbook, xlsxPath);
  console.log(`Generated ${template.xlsx}`);
}
