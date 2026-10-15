# LOOK image storage (durable copies)

Operational note. Related: `LOOK_INGESTION_V2.md`.

## Rules

- The **Instagram permalink** (`postUrl` / `postIdentity`) is the canonical provenance of a LOOK observation.
- Instagram CDN image URLs **expire** (hours to days). They are transport only.
- `LookObservation.imageUrl` keeps the original source URL **for audit only**. Never overwrite it.
- Every new observation **must** have a durable copy: ingestion fetches each image server-side and uploads it to
  Cloudflare R2 before any row is created. If storage is not configured, creating an observation fails closed.
- The UI renders `storedImageUrl` first and falls back to `imageUrl` only for legacy rows without a durable copy
  (`lookDisplayImageUrl` in `src/lib/look-observation.ts`; used by `/research/looks`, the lightbox and public `/`).
- Magazine and Store image handling are unrelated and unchanged.

## Data model (additive, nullable)

| column | meaning |
| --- | --- |
| `imageUrl` | original source URL (provenance, may be expired) |
| `storedImageKey` | R2 object key `look-observations/<accountId>/<post-slug>-<hash8>/<index>-<sha256_16>.<ext>` |
| `storedImageUrl` | durable public URL rendered by the UI |
| `storedImageAt` | when the durable copy was made |

NULL `stored*` = legacy row not yet recovered.

## Read model

Public-read R2 bucket (via `r2.dev` or a custom domain) and the **permanent public URL is persisted**. Chosen over
signed URLs (which expire and would recreate the original failure) and over an app proxy (extra load/latency).
Keys are content-addressed and immutable (`Cache-Control: immutable`), but they are *not secret*: the source posts are
public Instagram posts. Do not store anything private in this bucket.

## Configuration (server-side only, Railway variables)

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL`.
The API token should be scoped to Object Read & Write on this single bucket. Never prefix with `NEXT_PUBLIC_`.

## Fetch safety (no SSRF primitive)

HTTPS only, no credentials in URL, port 443 only, no localhost/`.local`/`.internal`/private/loopback/link-local IPs,
Instagram posts accept only `*.cdninstagram.com` / `*.fbcdn.net`, DNS answers are validated before the request **and**
again at connect time, redirects are not followed, `image/*` content type plus magic-byte sniffing
(jpeg/png/webp/gif/avif), 15 MB cap, 20 s timeout. Errors are generic and never include secrets.

## Ingestion lifecycle

validate metadata -> pre-check duplicates -> fetch + upload every image (all-or-nothing) -> create rows with
`imageUrl` (source) + `stored*` in one transaction -> on DB failure delete the objects this call uploaded
(never an object already referenced by a row).

## Recovering a legacy observation

1. Open `/research/looks` and expand "영구 이미지가 없는 기존 관측 … 이미지 복구".
2. Open the exact Instagram permalink in a normal logged-in browser and confirm it is the same post.
3. Copy the *currently visible* image address (right-click > copy image address; `*.cdninstagram.com`).
4. Paste it into that row's form and submit. Only `storedImageKey/Url/At` are written; review status, reviewer,
   gender, tags, cluster links, `imageUrl` and every other field are untouched, and no row is created.
   (`updatedAt` changes automatically via Prisma `@updatedAt`.)
5. If the post is gone or changed, do **not** substitute another image; leave the row and report it.

No Instagram private API, cookies, session tokens, anti-bot bypass or bulk scraping is used.

## Cost

Cloudflare R2 Standard free tier (currently 10 GB-month storage, 1 M Class A and 10 M Class B ops per month, free
egress). A review dataset of tens to a few hundred images of < 1 MB each is far below this. No guarantee; verify on
Cloudflare's pricing page. No image transformation or paid CDN product is used; originals only.
