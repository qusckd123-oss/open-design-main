import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fetchSourceImage, validateSourceImageUrl, type ImageTransport } from "../src/lib/look-image-fetch";
import { buildLookObservationRows, recoverLookObservationImage, recoverLookObservationImageFromFile, storeLookImageBatch, type LookImageRecoveryDb } from "../src/lib/look-image-ingest";
import { validateUploadedImage } from "../src/lib/look-image-upload";
import { getR2LookImageStore, lookImageKey, storeLookImage, type LookImageStore } from "../src/lib/look-image-storage";
import { lookDisplayImageUrl, postIdentity, publicLookClusters, type LookClusterCandidate, type LookObservationCandidate } from "../src/lib/look-observation";

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)]);
const publicResolver = async () => ["93.184.216.34"];
const IG = "https://scontent-gmp1-1.cdninstagram.com/v/t51/a.jpg?sig=abc";

function transport(opts: { status?: number; type?: string; body?: Buffer; length?: string; hang?: boolean }): ImageTransport {
  return async () => {
    if (opts.hang) await new Promise(() => undefined);
    const body = opts.body ?? JPEG;
    return { status: opts.status ?? 200, headers: { "content-type": opts.type ?? "image/jpeg", ...(opts.length ? { "content-length": opts.length } : {}) },
      body: (async function* () { yield body.subarray(0, 40); yield body.subarray(40); })(), destroy: () => undefined };
  };
}
const ok = { resolver: publicResolver, transport: transport({}) };

function memoryStore(failOn?: number) {
  const objects = new Map<string, Buffer>(); let puts = 0;
  const store: LookImageStore = {
    async put(key, body) { if (++puts === failOn) throw new Error("boom secret-access-key"); objects.set(key, body); },
    async delete(key) { objects.delete(key); },
    publicUrl: (key) => `https://img.example.com/${key}`
  };
  return { store, objects };
}
const none = async () => new Set<string>();

async function rejects(promise: Promise<unknown>, pattern?: RegExp) {
  await assert.rejects(promise, (e: Error) => { if (pattern) assert.match(e.message, pattern); assert.doesNotMatch(e.message, /secret|ECONN|10\.1\.2\.3/i); return true; });
}
/** Distinct bytes per call so each image gets its own content-addressed key. */
function uniqueBodies(): ImageTransport {
  let n = 0;
  return (...args) => transport({ body: Buffer.concat([JPEG, Buffer.from([++n])]) })(...args);
}

// 1-2. URL validation
validateSourceImageUrl(IG, "INSTAGRAM");
for (const bad of ["http://scontent.cdninstagram.com/a.jpg", "file:///etc/passwd", "data:image/png;base64,AAAA", "ftp://x.com/a.jpg", "https://localhost/a.jpg",
  "https://127.0.0.1/a.jpg", "https://10.0.0.5/a.jpg", "https://192.168.1.1/a.jpg", "https://172.20.0.1/a.jpg", "https://169.254.169.254/latest", "https://[::1]/a.jpg",
  "https://user:pw@x.cdninstagram.com/a.jpg", "https://x.cdninstagram.com:8443/a.jpg", "https://db.internal/a.jpg", "not a url"]) {
  assert.throws(() => validateSourceImageUrl(bad), bad);
}
assert.throws(() => validateSourceImageUrl("https://evil.example.com/a.jpg", "INSTAGRAM"));
assert.throws(() => validateSourceImageUrl("https://evilcdninstagram.com/a.jpg", "INSTAGRAM"));
validateSourceImageUrl("https://image.msscdn.net/thumbnails/snap/images/2026/10/22/a.jpg", "MUSINSA_STYLE");
assert.throws(() => validateSourceImageUrl("https://images.example.com/a.jpg", "MUSINSA_STYLE"));
assert.equal(postIdentity("https://www.musinsa.com/content/1465543723705276831", "MUSINSA_STYLE"), "musinsa.com/content/1465543723705276831");
assert.equal(postIdentity("https://www.musinsa.com/snap/1562601944454454787", "MUSINSA_STYLE"), "musinsa.com/snap/1562601944454454787");
assert.throws(() => postIdentity("https://www.musinsa.com/goods/123", "MUSINSA_STYLE"));
await rejects(fetchSourceImage(IG, { ...ok, resolver: async () => ["10.0.0.1"] }), /내부 주소/);
await rejects(fetchSourceImage(IG, { ...ok, resolver: async () => ["93.184.216.34", "127.0.0.1"] }), /내부 주소/);

// 3-5. content rules, size, timeout/failure
assert.equal((await fetchSourceImage(IG, ok)).contentType, "image/jpeg");
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({ type: "text/html" }) }), /이미지가 아닌/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({ body: Buffer.from("<html>not image</html>".repeat(5)) }) }), /지원하지 않는/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({ status: 403 }) }), /403/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({ length: "999999999" }) }), /용량/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({}), maxBytes: 50 }), /용량/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: transport({ hang: true }), timeoutMs: 30 }), /시간이 초과/);
await rejects(fetchSourceImage(IG, { resolver: publicResolver, transport: async () => { throw new Error("ECONNRESET 10.1.2.3"); } }), /가져오지 못했습니다/);

// 6. successful durable upload -> stable reference
{
  const { store, objects } = memoryStore();
  const input = { sourceUrl: IG, platform: "INSTAGRAM" as const, sourceAccountId: "acc1", postIdentity: "instagram.com/p/Dd9GCWzAcYf", imageIndex: 0 };
  const a = await storeLookImage(input, store, ok);
  const b = await storeLookImage(input, store, ok);
  assert.equal(a.key, b.key); assert.equal(a.url, b.url); assert.equal(objects.size, 1);
  assert.match(a.key, /^look-observations\/acc1\/instagram\.com-p-dd9gcwzacyf-[0-9a-f]{8}\/0-[0-9a-f]{16}\.jpg$/);
  assert.equal(a.url, `https://img.example.com/${a.key}`);
  assert.notEqual(lookImageKey({ ...input, bytes: JPEG, extension: "jpg", postIdentity: "instagram.com/p/dd9gcwzacyf" }), lookImageKey({ ...input, bytes: JPEG, extension: "jpg" }));
  assert.notEqual(lookImageKey({ ...input, bytes: Buffer.from("x"), extension: "jpg" }), a.key);
}
const r2Env = { R2_ACCOUNT_ID: "a", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s", R2_BUCKET_NAME: "b", R2_PUBLIC_BASE_URL: "https://img.example.com/" };
assert.throws(() => getR2LookImageStore({}), /설정이 완료되지/);
assert.throws(() => getR2LookImageStore({ ...r2Env, R2_PUBLIC_BASE_URL: "http://img.example.com" }), /https/);
assert.equal(getR2LookImageStore(r2Env).publicUrl("look-observations/x/y/0-ab.jpg"), "https://img.example.com/look-observations/x/y/0-ab.jpg");

// 7. new rows keep original source URL + durable reference
const ctx = { platform: "INSTAGRAM" as const, sourceAccountId: "acc1", postIdentity: "instagram.com/p/AAA" };
{
  const { store } = memoryStore();
  const stored = await storeLookImageBatch([{ imageUrl: IG, imageIndex: 0 }], ctx, store, none, ok);
  const [row] = buildLookObservationRows({ sourceAccountId: "acc1" }, stored);
  assert.equal(row!.imageUrl, IG);
  assert.equal(row!.storedImageUrl, stored[0]!.url);
  assert.equal(row!.storedImageKey, stored[0]!.key);
  assert.ok(row!.storedImageAt instanceof Date);
}

// 8. one failing image => whole batch fails, objects uploaded by it are cleaned up
{
  const { store, objects } = memoryStore();
  const imgs = [{ imageUrl: IG, imageIndex: 0 }, { imageUrl: "https://x.cdninstagram.com/b.jpg", imageIndex: 1 }];
  let call = 0;
  const bodies = uniqueBodies();
  const flaky: ImageTransport = (...args) => (++call === 2 ? Promise.reject(new Error("expired")) : bodies(...args));
  await rejects(storeLookImageBatch(imgs, ctx, store, none, { resolver: publicResolver, transport: flaky }));
  assert.equal(objects.size, 0);

  const second = memoryStore(2); // storage upload of 2nd image fails
  await rejects(storeLookImageBatch(imgs, ctx, second.store, none, { resolver: publicResolver, transport: uniqueBodies() }), /업로드하지 못했습니다/);
  assert.equal(second.objects.size, 0);

  // an object already referenced by an existing row is never deleted by cleanup
  const third = memoryStore();
  const existing = await storeLookImage({ sourceUrl: IG, ...ctx, imageIndex: 0 }, third.store, ok);
  let n = 0;
  const failSecond: ImageTransport = (...a) => ++n === 2 ? Promise.reject(new Error("x")) : transport({})(...a);
  await rejects(storeLookImageBatch(imgs, ctx, third.store, async () => new Set([existing.key]), { resolver: publicResolver, transport: failSecond }));
  assert.ok(third.objects.has(existing.key));
}

// 9-11. UI source order: durable first, legacy source fallback
assert.equal(lookDisplayImageUrl({ imageUrl: "https://src/expired.jpg", storedImageUrl: "https://img.example.com/s.jpg" }), "https://img.example.com/s.jpg");
assert.equal(lookDisplayImageUrl({ imageUrl: "https://src/legacy.jpg", storedImageUrl: null }), "https://src/legacy.jpg");
assert.equal(lookDisplayImageUrl({ imageUrl: "https://src/legacy.jpg" }), "https://src/legacy.jpg");
function obs(id: string, account: string, stored: string | null): LookObservationCandidate {
  return { id, sourceAccountId: account, platform: "INSTAGRAM", postIdentity: id, observationType: "REAL_WEAR", imageUrl: `https://src/${id}.jpg`, storedImageUrl: stored, postUrl: `https://www.instagram.com/p/${id}/`, observedAt: new Date("2026-10-01T00:00:00Z"), reviewStatus: "APPROVED", genderCandidate: "MEN" };
}
const cluster: LookClusterCandidate = { id: "c", gender: "MEN", title: "t", summary: "s", status: "APPROVED", tags: [], observations: [{ observation: obs("a", "x", "https://img.example.com/a.jpg") }, { observation: obs("b", "y", null) }] };
const [pub] = publicLookClusters([cluster]);
assert.deepEqual(pub!.images.map((i) => i.imageUrl).sort(), ["https://img.example.com/a.jpg", "https://src/b.jpg"]);
const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8").replace(/\r\n/g, "\n");
assert.match(read("src/app/research/looks/page.tsx"), /imageUrl: lookDisplayImageUrl\(row\)/);

// 12-13. recovery touches stored* only, never changes review/provenance, never creates rows
{
  const { store, objects } = memoryStore();
  const rows = new Map([["obs1", { id: "obs1", platform: "INSTAGRAM" as const, postIdentity: "instagram.com/p/Dd9GCWzAcYf", imageIndex: 0, sourceAccountId: "acc1", storedImageKey: null as string | null, reviewStatus: "APPROVED", reviewedBy: "kim", imageUrl: "https://expired" }]]);
  const writes: string[][] = [];
  const db: LookImageRecoveryDb = {
    async find(id) { return rows.get(id) ?? null; },
    async setStoredImage(id, data) { writes.push(Object.keys(data)); const row = rows.get(id); if (!row || row.storedImageKey) return 0; row.storedImageKey = data.storedImageKey; return 1; },
    isReferenced: none
  };
  const snapshot = () => JSON.stringify([...rows.values()].map(({ storedImageKey: _k, ...rest }) => rest));
  const before = snapshot();
  const result = await recoverLookObservationImage(db, store, "obs1", IG, ok);
  assert.deepEqual(writes, [["storedImageKey", "storedImageUrl", "storedImageAt"]]);
  assert.equal(rows.size, 1);
  assert.equal(snapshot(), before);
  assert.equal(rows.get("obs1")!.storedImageKey, result.key);
  await rejects(recoverLookObservationImage(db, store, "obs1", IG, ok), /이미 영구 저장/);
  await rejects(recoverLookObservationImage(db, store, "missing", IG, ok), /찾을 수 없습니다/);
  assert.equal(objects.size, 1);
  const failing = new Map([["o2", { id: "o2", platform: "INSTAGRAM" as const, postIdentity: "p2", imageIndex: 0, sourceAccountId: "acc1", storedImageKey: null }]]);
  await rejects(recoverLookObservationImage({ ...db, find: async (id) => failing.get(id) ?? null, setStoredImage: async () => 0 }, store, "o2", IG, { resolver: publicResolver, transport: transport({ body: Buffer.concat([JPEG, Buffer.from("zz")]) }) }), /이미 변경/);
  assert.equal(objects.size, 1); // orphan from the failed update was removed
}
const service = read("src/services/look-service.ts");
const recoverBlock = service.slice(service.indexOf("export async function recoverLookObservationStoredImage"));
assert.doesNotMatch(recoverBlock.slice(0, recoverBlock.indexOf("\n}\n")), /reviewStatus|reviewedBy|reviewedAt|genderCandidate|\.create\(|createMany|\.delete|upsert/);

// 15. FILE-UPLOAD recovery (primary path for Instagram): validation, R2 upload, stored*-only update, cleanup
{
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 2)]);
  const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([1, 0, 0, 0]), Buffer.from("WEBP"), Buffer.alloc(16, 3)]);
  const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  assert.equal(validateUploadedImage(JPEG, "image/jpeg").extension, "jpg");
  assert.equal(validateUploadedImage(PNG, "image/png").extension, "png");
  assert.equal(validateUploadedImage(WEBP, "image/webp").contentType, "image/webp");
  assert.throws(() => validateUploadedImage(SVG, "image/svg+xml"), /JPEG, PNG, WebP/);
  assert.throws(() => validateUploadedImage(SVG, "image/jpeg"), /이미지가 아닙니다/);
  assert.throws(() => validateUploadedImage(Buffer.from("<html><script>alert(1)</script></html>"), "image/jpeg"), /이미지가 아닙니다/);
  assert.throws(() => validateUploadedImage(PNG, "image/jpeg"), /일치하지 않습니다/);
  assert.throws(() => validateUploadedImage(Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]), "image/png"), /이미지가 아닙니다/);
  assert.throws(() => validateUploadedImage(Buffer.alloc(0), "image/jpeg"), /빈 파일/);
  assert.throws(() => validateUploadedImage(Buffer.concat([JPEG, Buffer.alloc(15 * 1024 * 1024)]), "image/jpeg"), /15MB/);
  assert.throws(() => validateUploadedImage(Buffer.concat([Buffer.from("GIF89a"), Buffer.alloc(20)]), "image/gif"), /JPEG, PNG, WebP/);
  assert.equal(validateUploadedImage(JPEG, "image/jpeg; charset=binary").extension, "jpg");

  const mk = () => new Map([["obs1", { id: "obs1", platform: "INSTAGRAM" as const, postIdentity: "instagram.com/p/Ddiy2r3AdN-", imageIndex: 0, sourceAccountId: "acc1", storedImageKey: null as string | null, imageUrl: "https://expired/original.jpg", reviewStatus: "APPROVED", genderCandidate: "MEN", reviewedBy: "1", postUrl: "https://www.instagram.com/p/Ddiy2r3AdN-/" }]]);
  const rows = mk();
  const { store, objects } = memoryStore();
  const writes: string[][] = [];
  const db: LookImageRecoveryDb = {
    async find(id) { return rows.get(id) ?? null; },
    async setStoredImage(id, data) { writes.push(Object.keys(data)); const row = rows.get(id); if (!row || row.storedImageKey) return 0; row.storedImageKey = data.storedImageKey; return 1; },
    isReferenced: none
  };
  const snap = () => JSON.stringify([...rows.values()].map(({ storedImageKey: _k, ...rest }) => rest));
  const before = snap();
  // unknown observation / invalid file never reach R2
  await rejects(recoverLookObservationImageFromFile(db, store, "missing", { bytes: JPEG, mime: "image/jpeg" }), /찾을 수 없습니다/);
  await rejects(recoverLookObservationImageFromFile(db, store, "obs1", { bytes: PNG, mime: "image/jpeg" }), /일치하지 않습니다/);
  assert.equal(objects.size, 0);
  const result = await recoverLookObservationImageFromFile(db, store, "obs1", { bytes: JPEG, mime: "image/jpeg" });
  assert.deepEqual(writes, [["storedImageKey", "storedImageUrl", "storedImageAt"]]);
  assert.equal(snap(), before); // imageUrl, review state, reviewer, gender untouched
  assert.equal(rows.size, 1);
  assert.match(result.key, /\.jpg$/);
  assert.ok(result.url.startsWith("https://img.example.com/look-observations/"));
  assert.equal(objects.get(result.key)!.equals(JPEG), true);
  await rejects(recoverLookObservationImageFromFile(db, store, "obs1", { bytes: JPEG, mime: "image/jpeg" }), /이미 영구 저장/);
  assert.equal(objects.size, 1);

  // R2 failure leaves the DB unchanged
  const r2 = mk(); const failing = memoryStore(1); let dbCalls = 0;
  await rejects(recoverLookObservationImageFromFile({ ...db, find: async (id) => r2.get(id) ?? null, setStoredImage: async () => { dbCalls++; return 1; } }, failing.store, "obs1", { bytes: JPEG, mime: "image/jpeg" }), /업로드하지 못했습니다/);
  assert.equal(dbCalls, 0);
  // DB failure removes the orphan; an already-referenced object is kept
  const r3 = mk(); const orphan = memoryStore();
  await assert.rejects(recoverLookObservationImageFromFile({ ...db, find: async (id) => r3.get(id) ?? null, setStoredImage: async () => { throw new Error("db down"); } }, orphan.store, "obs1", { bytes: JPEG, mime: "image/jpeg" }));
  assert.equal(orphan.objects.size, 0);
  const keep = memoryStore();
  const key = lookImageKey({ sourceAccountId: "acc1", postIdentity: "instagram.com/p/Ddiy2r3AdN-", imageIndex: 0, bytes: JPEG, extension: "jpg" });
  await assert.rejects(recoverLookObservationImageFromFile({ ...db, find: async (id) => r3.get(id) ?? null, setStoredImage: async () => { throw new Error("db down"); }, isReferenced: async () => new Set([key]) }, keep.store, "obs1", { bytes: JPEG, mime: "image/jpeg" }));
  assert.equal(keep.objects.size, 1);
}
const route = read("src/app/api/look-images/recover/route.ts");
assert.match(route, /verifySessionToken/);
assert.match(route, /MAX_LOOK_IMAGE_BYTES/);
assert.doesNotMatch(route, /base64|searchParams/);
const fileRecover = service.slice(service.indexOf("export async function recoverLookObservationStoredImageFromFile"));
assert.doesNotMatch(fileRecover.slice(0, fileRecover.indexOf("\n}\n")), /reviewStatus|reviewedBy|reviewedAt|genderCandidate|\.create\(|createMany|\.delete|upsert/);
assert.match(read("src/app/research/looks/page.tsx"), /LookImageRecoverForm/);
assert.match(read("src/app/research/looks/LookImageRecoverForm.tsx"), /type="file"[^>]*accept="image\/jpeg,image\/png,image\/webp"/);
assert.doesNotMatch(read("src/app/research/looks/LookImageRecoverForm.tsx"), /R2_|SECRET/);

// 14. the @oiehofo provenance audit path is read-only
const audit = read("scripts/audit-look-review-provenance.ts");
assert.match(audit, /BEGIN READ ONLY/);
assert.doesNotMatch(audit, /\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE)\b/);

// credentials never reach client components
for (const f of ["src/app/research/looks/LookReviewGallery.tsx", "src/app/research/looks/LookPostForm.tsx"]) assert.doesNotMatch(read(f), /R2_|SECRET/);
console.log("LOOK durable image tests passed");
