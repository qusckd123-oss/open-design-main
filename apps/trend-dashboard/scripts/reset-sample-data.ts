import { resetSampleBusinessData } from "../src/services/sample-business-data-service";

async function main() {
  const result = await resetSampleBusinessData();
  console.log("SAMPLE DATA RESET COMPLETE");
  console.log(`Sales rows: ${result.sales.successRows}/${result.sales.totalRows}`);
  console.log(`Market rows: ${result.market.successRows}/${result.market.totalRows}`);
}

main().catch((error) => {
  console.error("Sample data reset failed:", error);
  process.exitCode = 1;
});
