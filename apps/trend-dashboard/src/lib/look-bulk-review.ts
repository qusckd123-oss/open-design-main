export type BulkReviewGender = "MEN" | "WOMEN" | "UNKNOWN";
export type BulkReviewStatus = "APPROVED" | "REJECTED";

export type BulkReviewSelection = { id: string; gender: BulkReviewGender };
export type BulkReviewRequest = {
  status: BulkReviewStatus;
  reviewerName: string;
  selections: BulkReviewSelection[];
};

type PendingRow = { id: string; reviewStatus: string };
type BulkReviewTransaction = {
  lookObservation: {
    findMany(args: { where: { id: { in: string[] } }; select: { id: true; reviewStatus: true } }): Promise<PendingRow[]>;
    updateMany(args: {
      where: { id: string; reviewStatus: "PENDING" };
      data: { reviewStatus: BulkReviewStatus; reviewedBy: string; reviewedAt: Date; genderCandidate?: "MEN" | "WOMEN" };
    }): Promise<{ count: number }>;
  };
};

export function parseBulkReviewRequest(input: Record<string, string>): BulkReviewRequest {
  const status = input.status;
  if (status !== "APPROVED" && status !== "REJECTED") throw new Error("검토 상태가 올바르지 않습니다.");
  const reviewerName = (input.reviewerName ?? "").trim();
  if (!reviewerName || reviewerName.length > 80) throw new Error("검토자 이름을 1~80자로 입력하세요.");
  let parsed: unknown;
  try { parsed = JSON.parse(input.reviewRows ?? ""); } catch { throw new Error("선택한 관측을 확인할 수 없습니다."); }
  if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) throw new Error("관측 1~100건을 선택하세요.");
  const selections = parsed.map((row): BulkReviewSelection => {
    if (!row || typeof row !== "object" ||
        typeof row.id !== "string" || !row.id.trim() || row.id.length > 200 ||
        !["MEN", "WOMEN", "UNKNOWN"].includes(row.gender)) {
      throw new Error("선택한 관측 정보가 올바르지 않습니다.");
    }
    return { id: row.id, gender: row.gender };
  });
  if (new Set(selections.map((row) => row.id)).size !== selections.length) throw new Error("같은 관측을 중복 선택할 수 없습니다.");
  if (status === "APPROVED" && selections.some((row) => row.gender === "UNKNOWN")) {
    throw new Error("선택한 모든 관측에 MEN 또는 WOMEN을 지정한 뒤 승인하세요.");
  }
  return { status, reviewerName, selections };
}

// Called only inside one Prisma transaction. A missing/non-pending row or a
// concurrent status change throws, causing Prisma to roll back every update.
export async function applyBulkLookReview(tx: BulkReviewTransaction, request: BulkReviewRequest, reviewedAt = new Date()): Promise<number> {
  const ids = request.selections.map((row) => row.id);
  const rows = await tx.lookObservation.findMany({ where: { id: { in: ids } }, select: { id: true, reviewStatus: true } });
  if (rows.length !== ids.length || rows.some((row) => row.reviewStatus !== "PENDING")) {
    throw new Error("선택한 관측 중 없거나 이미 검토된 항목이 있습니다. 새로고침 후 다시 선택하세요.");
  }
  for (const selection of request.selections) {
    const result = await tx.lookObservation.updateMany({
      where: { id: selection.id, reviewStatus: "PENDING" },
      data: {
        reviewStatus: request.status,
        reviewedBy: request.reviewerName,
        reviewedAt,
        ...(request.status === "APPROVED" ? { genderCandidate: selection.gender as "MEN" | "WOMEN" } : {})
      }
    });
    if (result.count !== 1) throw new Error("검토 도중 관측 상태가 변경되었습니다. 다시 확인하세요.");
  }
  return ids.length;
}
