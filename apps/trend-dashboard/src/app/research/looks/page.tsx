import type { Metadata } from "next";
import { getLookResearchData } from "@/services/look-service";
import { mutateLook } from "./actions";
import { LookPostForm } from "./LookPostForm";

export const metadata: Metadata = { title: "착장 관측 검토 | RESEARCH" };
type Props = { searchParams: Promise<{ notice?: string }> };
type Observation = Awaited<ReturnType<typeof getLookResearchData>>["observations"][number];
const box = "border border-line bg-white p-5";
const field = "w-full border border-line bg-white px-3 py-2 text-sm";
const button = "bg-ink px-4 py-2 text-sm font-semibold text-white";
const genders = ["MEN", "WOMEN", "UNKNOWN"] as const;
const dimensions = ["OUTERWEAR", "TOP", "BOTTOM", "FOOTWEAR", "FIT", "LAYERING", "DETAIL"] as const;
const typeLabels = { REAL_WEAR: "실착", CURATED_LOOK: "큐레이션", STYLE_MEDIA: "스타일 미디어" } as const;

export default async function LookResearchPage({ searchParams }: Props) {
  const { accounts, observations, clusters } = await getLookResearchData();
  const notice = (await searchParams).notice;
  const approvedObservations = observations.filter((row) => row.reviewStatus === "APPROVED");
  const batches = new Map<string, Observation[]>();
  for (const row of observations) {
    const key = `${row.platform}:${row.postIdentity}`;
    const batch = batches.get(key) ?? [];
    batch.push(row);
    batches.set(key, batch);
  }

  return <div className="space-y-10">
    <header><p className="text-xs font-semibold uppercase tracking-widest text-signal">RESEARCH / MANUAL REVIEW</p><h1 className="mt-2 text-3xl font-semibold">착장 관측 관리</h1><p className="mt-2 text-sm text-muted">공유 access code로 접근합니다. 검토자 이름은 직접 입력한 기록이며 개인 계정 인증을 뜻하지 않습니다.</p>{notice ? <p role="status" className="mt-3 border border-line bg-white p-3 text-sm">{notice}</p> : null}</header>

    <section className="space-y-4"><h2 className="text-xl font-semibold">1. 소스 계정</h2>
      <form action={mutateLook} className={`${box} grid gap-3 md:grid-cols-2`}><input type="hidden" name="operation" value="account-create" />
        <label>플랫폼<select name="platform" className={field}><option value="INSTAGRAM">Instagram</option><option value="MUSINSA_STYLE">무신사 STYLE · 수동</option><option value="OTHER_WEB">기타 웹 · 수동</option></select></label>
        <label>계정명 / 소스 이름<input required name="handle" placeholder="@handle 또는 소스 이름" className={field} /></label>
        <label>표시 이름<input name="displayName" className={field} /></label>
        <label>프로필 URL<input name="profileUrl" type="url" placeholder="Instagram 자동 생성 · 웹 소스는 필수" className={field} /></label>
        <label>대상 범위<select name="genderScope" className={field}><option>UNKNOWN</option><option>MEN</option><option>WOMEN</option><option>MIXED</option></select></label>
        <label>메모<input name="notes" className={field} /></label>
        <p className="text-xs text-muted md:col-span-2">Instagram은 @handle과 handle을 동일하게 저장합니다. 소스를 등록해도 자동 수집은 시작되지 않습니다.</p><button className={button}>계정 등록</button>
      </form>
      <div className="grid gap-3 md:grid-cols-2">{accounts.map((account) => <form key={account.id} action={mutateLook} className={box}>
        <input type="hidden" name="operation" value="account-update" /><input type="hidden" name="accountId" value={account.id} />
        <p className="font-semibold">{account.platform} · {account.platform === "INSTAGRAM" ? "@" : ""}{account.handle}</p><a href={account.profileUrl} target="_blank" rel="noreferrer" className="text-xs text-signal">소스 열기 ↗</a>
        <div className="mt-3 grid gap-2"><label>표시 이름<input name="displayName" defaultValue={account.displayName ?? ""} className={field} /></label><label>프로필 URL<input name="profileUrl" type="url" defaultValue={account.profileUrl} className={field} /></label><label>대상 범위<select name="genderScope" defaultValue={account.genderScope} className={field}>{["UNKNOWN", "MEN", "WOMEN", "MIXED"].map((value) => <option key={value}>{value}</option>)}</select></label><label>메모<input name="notes" defaultValue={account.notes ?? ""} className={field} /></label><label className="text-sm"><input name="active" type="checkbox" defaultChecked={account.active} /> 활성</label><button className={button}>계정 수정</button></div>
      </form>)}</div>
    </section>

    <section className="space-y-4"><h2 className="text-xl font-semibold">2. 게시물 단위 수동 관측</h2>
      <LookPostForm accounts={accounts.map(({ id, platform, handle, active }) => ({ id, platform, handle, active }))} />
      <div className="space-y-4">{[...batches.entries()].map(([identity, rows]) => <article key={identity} className={box}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3"><div><p className="font-semibold">{rows[0]?.sourceAccount.platform} · {rows[0]?.sourceAccount.handle}</p><p className="text-xs text-muted">게시물 1개 · 이미지 {rows.length}개 · 발행 {rows[0]?.publishedAt?.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" }) ?? "미상"}</p></div><a href={rows[0]?.postUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-signal">원본 게시물 ↗</a></div>
        {rows[0]?.captionText ? <p className="mt-3 text-sm text-muted">{rows[0].captionText}</p> : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">{rows.sort((a, b) => a.imageIndex - b.imageIndex).map((observation) => <ObservationCard key={observation.id} observation={observation} />)}</div>
      </article>)}</div>
    </section>

    <section className="space-y-4"><h2 className="text-xl font-semibold">3. 사람 검토 클러스터</h2>
      <form action={mutateLook} className={`${box} grid gap-3 md:grid-cols-2`}><input type="hidden" name="operation" value="cluster-create" /><label>성별<select name="gender" className={field}><option>MEN</option><option>WOMEN</option></select></label><label>룩 제목<input required name="title" className={field} /></label><label className="md:col-span-2">사람 검토 요약<input required name="summary" className={field} /></label><button className={button}>초안 만들기</button></form>
      <div className="grid gap-4 lg:grid-cols-2">{clusters.map((cluster) => <article key={cluster.id} className={box}><h3 className="font-semibold">{cluster.title} · {cluster.gender} · {cluster.status}</h3><p className="mt-1 text-sm text-muted">{cluster.summary}</p><p className="mt-2 text-xs">연결된 승인 관측: {cluster.observations.map((link) => `${link.observation.sourceAccount.handle} #${link.observation.imageIndex}`).join(" · ") || "없음"}</p>
        {cluster.status === "DRAFT" ? <><form action={mutateLook} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="operation" value="cluster-link" /><input type="hidden" name="clusterId" value={cluster.id} /><select name="observationId" required className={field}><option value="">승인 관측 선택</option>{approvedObservations.filter((row) => row.genderCandidate === cluster.gender && !cluster.observations.some((link) => link.observationId === row.id)).map((row) => <option key={row.id} value={row.id}>{row.sourceAccount.handle} · #{row.imageIndex} · {row.observationType ?? "미분류"} · {row.postUrl}</option>)}</select><button className={button}>관측 연결</button></form><form action={mutateLook} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="operation" value="cluster-approve" /><input type="hidden" name="clusterId" value={cluster.id} /><input required name="reviewerName" placeholder="검토자 이름" className={field} /><button className={button}>서로 다른 2개 소스 확인 후 승인</button></form></> : null}
        {cluster.tags.length ? <p className="mt-2 text-xs text-muted">검토 태그: {cluster.tags.map((tag) => `${tag.dimension} ${tag.value}`).join(" · ")}</p> : null}
        <TagForm parent="CLUSTER" parentId={cluster.id} />
      </article>)}</div>
    </section>
  </div>;
}

function ObservationCard({ observation }: { observation: Observation }) {
  return <div className="border border-line p-3">
    <div className="flex gap-4"><a href={observation.postUrl} target="_blank" rel="noreferrer" className="h-36 w-28 shrink-0 bg-[#f1f0ec]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={observation.imageUrl} alt="수동 등록된 관측 이미지" loading="lazy" className="h-full w-full object-cover" /></a><div className="min-w-0 text-sm"><p className="font-semibold">#{observation.imageIndex} · {observation.observationType ? typeLabels[observation.observationType] : "유형 미분류"}</p><p className="mt-1 text-xs text-muted">{observation.reviewStatus} · {observation.genderCandidate} · 관측 {observation.observedAt.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}</p><p className="mt-1 text-xs text-muted">{observation.platform} · {observation.sourceAccount.handle}</p>{observation.tags.length ? <p className="mt-2 text-xs text-muted">검토 태그: {observation.tags.map((tag) => `${tag.dimension} ${tag.value}`).join(" · ")}</p> : null}</div></div>
    <form action={mutateLook} className="mt-4 grid gap-2 sm:grid-cols-2"><input type="hidden" name="operation" value="observation-review" /><input type="hidden" name="observationId" value={observation.id} /><label>성별<select name="gender" defaultValue={observation.genderCandidate} className={field}>{genders.map((gender) => <option key={gender}>{gender}</option>)}</select></label><label>검토자 이름<input required name="reviewerName" className={field} /></label><button name="status" value="APPROVED" className={button}>승인</button><button name="status" value="REJECTED" className="border border-line px-4 py-2 text-sm">반려</button></form>
    {observation.reviewStatus === "APPROVED" ? <TagForm parent="OBSERVATION" parentId={observation.id} /> : null}
  </div>;
}

function TagForm({ parent, parentId }: { parent: "CLUSTER" | "OBSERVATION"; parentId: string }) {
  return <form action={mutateLook} className="mt-4 grid gap-2 border-t border-line pt-3 sm:grid-cols-2"><input type="hidden" name="operation" value="tag-add" /><input type="hidden" name="parent" value={parent} /><input type="hidden" name="parentId" value={parentId} /><select name="dimension" className={field}>{dimensions.map((value) => <option key={value}>{value}</option>)}</select><input required name="value" placeholder="검토한 태그 값" className={field} /><input required name="reviewerName" placeholder="검토자 이름" className={field} /><button className={button}>태그 기록</button></form>;
}
