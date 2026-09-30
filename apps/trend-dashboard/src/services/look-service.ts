import { Prisma, type LookTagDimension } from "@prisma/client";
import { prisma } from "@/db/client";
import { withTransientDbReadRetry } from "@/db/transient-read-retry";
import { instagramProfileUrl, manualLookImageRows, normalizeInstagramHandle, optionalPublishedDate, postIdentity, publicLookClusters, requireHttpUrl, validateInstagramProfile } from "@/lib/look-observation";

function required(value: string | undefined, label: string, max = 200): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed.length > max) throw new Error(`${label}: 1~${max}자를 입력하세요.`);
  return trimmed;
}

function optional(value: string | undefined, max = 2000): string | null {
  const trimmed = (value ?? "").trim();
  if (trimmed.length > max) throw new Error(`입력은 ${max}자를 넘을 수 없습니다.`);
  return trimmed || null;
}

function choice<T extends string>(value: string | undefined, values: readonly T[], label: string): T {
  if (!values.includes(value as T)) throw new Error(`${label}: 선택값이 올바르지 않습니다.`);
  return value as T;
}

function reviewer(value: string | undefined) { return required(value, "검토자 이름", 80); }

export async function getPublicLooks() {
  return withTransientDbReadRetry(async () => publicLookClusters(await prisma.lookCluster.findMany({
    where: { status: "APPROVED" },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    include: { observations: { include: { observation: true } }, tags: { orderBy: [{ dimension: "asc" }, { value: "asc" }] } }
  })));
}

export async function getLookResearchData() {
  return withTransientDbReadRetry(async () => {
    const [accounts, observations, clusters] = await Promise.all([
      prisma.lookSourceAccount.findMany({ orderBy: [{ active: "desc" }, { createdAt: "desc" }], take: 200 }),
      prisma.lookObservation.findMany({ include: { sourceAccount: true, tags: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 200 }),
      prisma.lookCluster.findMany({ include: { observations: { include: { observation: { include: { sourceAccount: true } } } }, tags: true }, orderBy: [{ createdAt: "desc" }, { id: "asc" }], take: 100 })
    ]);
    return { accounts, observations, clusters };
  });
}

export async function createLookAccount(input: Record<string, string>) {
  const platform = choice(input.platform, ["INSTAGRAM", "MUSINSA_STYLE", "OTHER_WEB"] as const, "플랫폼");
  const handle = platform === "INSTAGRAM" ? normalizeInstagramHandle(input.handle ?? "") : required(input.handle, "소스 이름", 100).toLowerCase();
  const profileUrl = platform === "INSTAGRAM" ? (optional(input.profileUrl, 2048) ?? instagramProfileUrl(handle)) : required(input.profileUrl, "프로필 URL", 2048);
  const profile = requireHttpUrl(profileUrl, "프로필");
  if (platform === "INSTAGRAM") validateInstagramProfile(profileUrl, handle);
  if (platform === "MUSINSA_STYLE" && profile.hostname.toLowerCase().replace(/^www\./, "") !== "musinsa.com") throw new Error("무신사 소스 URL이 필요합니다.");
  return prisma.lookSourceAccount.create({ data: {
    platform, handle, profileUrl,
    displayName: optional(input.displayName, 150),
    genderScope: choice(input.genderScope, ["MEN", "WOMEN", "MIXED", "UNKNOWN"] as const, "계정 성별 범위"),
    notes: optional(input.notes), collectionMode: "MANUAL"
  } });
}

export async function updateLookAccount(input: Record<string, string>) {
  const existing = await prisma.lookSourceAccount.findUniqueOrThrow({ where: { id: required(input.accountId, "계정 ID") } });
  const profileUrl = existing.platform === "INSTAGRAM" ? (optional(input.profileUrl, 2048) ?? instagramProfileUrl(existing.handle)) : required(input.profileUrl, "프로필 URL", 2048);
  const profile = requireHttpUrl(profileUrl, "프로필");
  if (existing.platform === "INSTAGRAM") validateInstagramProfile(profileUrl, existing.handle);
  if (existing.platform === "MUSINSA_STYLE" && profile.hostname.toLowerCase().replace(/^www\./, "") !== "musinsa.com") throw new Error("무신사 소스 URL이 필요합니다.");
  return prisma.lookSourceAccount.update({ where: { id: existing.id }, data: {
    profileUrl, displayName: optional(input.displayName, 150), notes: optional(input.notes),
    genderScope: choice(input.genderScope, ["MEN", "WOMEN", "MIXED", "UNKNOWN"] as const, "계정 성별 범위"),
    active: input.active === "on"
  } });
}

export async function createLookObservationBatch(input: Record<string, string>, imageUrls: string[]) {
  const account = await prisma.lookSourceAccount.findUniqueOrThrow({ where: { id: required(input.accountId, "계정 ID") } });
  if (!account.active) throw new Error("비활성 계정에는 관측을 추가할 수 없습니다.");
  const postUrl = required(input.postUrl, "게시물 URL", 2048);
  const identity = postIdentity(postUrl, account.platform);
  const observationType = choice(input.observationType, ["REAL_WEAR", "CURATED_LOOK", "STYLE_MEDIA"] as const, "관측 유형");
  if (account.platform === "INSTAGRAM" && observationType === "STYLE_MEDIA") throw new Error("Instagram 관측은 실착 또는 큐레이션으로 구분하세요.");
  if (account.platform !== "INSTAGRAM" && observationType !== "STYLE_MEDIA") throw new Error("웹 소스 관측은 스타일 미디어로 구분하세요.");
  const images = manualLookImageRows(imageUrls);
  const publishedAt = optionalPublishedDate(input.publishedAt ?? "");
  const captionText = optional(input.captionText, 5000);
  const observedAt = new Date();
  return prisma.$transaction((tx) => tx.lookObservation.createMany({ data: images.map(({ imageUrl, imageIndex }) => ({
    sourceAccountId: account.id, platform: account.platform, postUrl, postIdentity: identity,
    imageUrl, imageIndex, publishedAt, observedAt, captionText, observationType, collectionMethod: "MANUAL"
  })) }));
}

export async function reviewLookObservation(input: Record<string, string>) {
  const status = choice(input.status, ["APPROVED", "REJECTED"] as const, "검토 상태");
  const gender = choice(input.gender, ["MEN", "WOMEN", "UNKNOWN"] as const, "착장 성별");
  if (status === "APPROVED" && gender === "UNKNOWN") throw new Error("승인하려면 MEN 또는 WOMEN을 검토해 지정하세요.");
  const id = required(input.observationId, "관측 ID");
  return prisma.lookObservation.update({ where: { id }, data: {
    reviewStatus: status, genderCandidate: gender, reviewedBy: reviewer(input.reviewerName), reviewedAt: new Date()
  } });
}

export async function createLookCluster(input: Record<string, string>) {
  const gender = choice(input.gender, ["MEN", "WOMEN"] as const, "클러스터 성별");
  return prisma.lookCluster.create({ data: { gender, title: required(input.title, "클러스터 제목", 180), summary: required(input.summary, "검토 요약", 1000) } });
}

export async function addLookToCluster(input: Record<string, string>) {
  const clusterId = required(input.clusterId, "클러스터 ID");
  const observationId = required(input.observationId, "관측 ID");
  return prisma.$transaction(async (tx) => {
    const [cluster, observation] = await Promise.all([
      tx.lookCluster.findUniqueOrThrow({ where: { id: clusterId } }),
      tx.lookObservation.findUniqueOrThrow({ where: { id: observationId } })
    ]);
    if (cluster.status !== "DRAFT") throw new Error("초안 클러스터에만 관측을 연결할 수 있습니다.");
    if (observation.reviewStatus !== "APPROVED" || observation.genderCandidate !== cluster.gender) throw new Error("같은 성별로 승인된 관측만 연결할 수 있습니다.");
    return tx.lookClusterObservation.create({ data: { clusterId, observationId } });
  });
}

export async function approveLookCluster(input: Record<string, string>) {
  const clusterId = required(input.clusterId, "클러스터 ID");
  const approvedBy = reviewer(input.reviewerName);
  return prisma.$transaction(async (tx) => {
    const cluster = await tx.lookCluster.findUniqueOrThrow({ where: { id: clusterId }, include: { observations: { include: { observation: true } } } });
    if (cluster.status !== "DRAFT" || cluster.gender === "UNKNOWN") throw new Error("MEN/WOMEN 초안만 승인할 수 있습니다.");
    const approved = cluster.observations.map((link) => link.observation).filter((row) => row.reviewStatus === "APPROVED" && row.genderCandidate === cluster.gender);
    if (approved.length !== cluster.observations.length || new Set(approved.map((row) => row.sourceAccountId)).size < 2) {
      throw new Error("동일 성별의 승인 관측이 서로 다른 두 계정 이상에서 필요합니다.");
    }
    return tx.lookCluster.update({ where: { id: clusterId }, data: { status: "APPROVED", approvedBy, approvedAt: new Date() } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function addReviewedLookTag(input: Record<string, string>) {
  const dimension = choice(input.dimension, ["OUTERWEAR", "TOP", "BOTTOM", "FOOTWEAR", "FIT", "LAYERING", "DETAIL"] as const, "태그 차원") as LookTagDimension;
  const value = required(input.value, "검토 태그", 120);
  const reviewerName = reviewer(input.reviewerName);
  const parent = choice(input.parent, ["OBSERVATION", "CLUSTER"] as const, "태그 대상");
  const id = required(input.parentId, "태그 대상 ID");
  if (parent === "OBSERVATION") {
    const row = await prisma.lookObservation.findUniqueOrThrow({ where: { id } });
    if (row.reviewStatus !== "APPROVED") throw new Error("승인된 관측만 태그를 검토할 수 있습니다.");
  } else {
    await prisma.lookCluster.findUniqueOrThrow({ where: { id } });
  }
  return prisma.reviewedLookTag.create({ data: { dimension, value, reviewerName,
    ...(parent === "OBSERVATION" ? { observationId: id } : { clusterId: id }) } });
}

export function lookMutationError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "이미 등록된 계정·관측·태그입니다.";
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return "대상을 찾을 수 없습니다.";
  if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientInitializationError) return "데이터를 처리할 수 없습니다. 잠시 후 다시 시도하세요.";
  return error instanceof Error ? error.message : "처리할 수 없습니다.";
}
