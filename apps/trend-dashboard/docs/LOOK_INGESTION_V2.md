# LOOK manual ingestion V2 (2026-09-30)

LOOK remains a human-reviewed lane. `REAL_WEAR` means a real person wearing an outfit, `CURATED_LOOK` means an Instagram outfit-curation post, and `STYLE_MEDIA` means web-based styling/editorial content. The classification is entered by a reviewer, never inferred from imagery or captions. Existing observations, if any, remain `NULL` (unclassified) after the additive migration; no historical row is silently relabelled.

## Provenance and counts

Each image remains a `LookObservation` with its source account, platform, exact post URL, canonical post identity, assigned image index, optional publication date/caption, observed timestamp, and review status. The V2 form submits 1–10 images for one post; input order yields indexes `0..n-1`. One transaction inserts the whole batch, and the existing unique `(platform, postIdentity, imageIndex)` constraint rejects a duplicate without partial rows. A later attempt to re-enter the same post starts again at index 0 and fails as a batch; there is no silent overwrite.

The public page reads approved clusters and approved observations only. It displays image counts by type, distinct posts by type, and distinct Instagram source accounts for `REAL_WEAR`. Carousel images from one post count as multiple image observations but one post and one account. `STYLE_MEDIA` never raises the Instagram account count. Cluster ordering remains latest observation first; a tie uses distinct Instagram real-wear accounts, then overall distinct source accounts. This is not a popularity, sales, or trend score. Cluster approval still requires approved same-gender observations from at least two distinct registered sources; curation or style-media evidence is shown honestly and never relabelled real wear.

## Image persistence

The app currently has no durable upload/object-storage service. Railway app filesystem is not treated as persistent media storage. V2 therefore accepts only a manually verified public HTTP(S) image URL and preserves the original post link. External CDN links, particularly Instagram media links, can expire or stop hotlinking; staff must check image availability before approval and revisit broken references. No image copying, cookies, unofficial API, or paid storage service is added.

## MUSINSA STYLE

Existing repo audits mark Musinsa automated collection `RESTRICTED`. A fresh 2026-09-30 check of `https://www.musinsa.com/robots.txt` showed `User-agent: * / Disallow: /` for unlisted collectors. Our collector identity is not allowlisted. Thus no automated Musinsa collector is implemented, regardless of what a browser or search crawler can display.

Human-readable routes observed: list `https://www.musinsa.com/content/list?contentCategoryCode=019002001`; STYLE detail examples `https://www.musinsa.com/content/1531948406752475462?contentCategoryCode=001001` and `https://www.musinsa.com/content/1428255336070177853`. The sampled detail pages show title, date, body images and styling text, but this does not grant automated collection permission. V2 permits only manual `MUSINSA_STYLE` source registration and exact `/content/<id>` post plus verified image URL input. The database post identity strips the optional category query string from that path to avoid duplicate article identities.
