import { lookup as dnsLookup } from "node:dns";
import { promises as dns } from "node:dns";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { LookPlatformCode } from "./look-observation";

export const MAX_LOOK_IMAGE_BYTES = 15 * 1024 * 1024;
export const LOOK_IMAGE_FETCH_TIMEOUT_MS = 20_000;

export type SniffedImage = { contentType: string; extension: string };
export type FetchedImage = SniffedImage & { bytes: Buffer };
export type TransportResponse = { status: number; headers: Record<string, string | undefined>; body: AsyncIterable<Uint8Array>; destroy: () => void };
export type ImageTransport = (url: URL, options: { timeoutMs: number }) => Promise<TransportResponse>;
export type HostResolver = (hostname: string) => Promise<string[]>;
export type FetchSourceImageOptions = {
  platform?: LookPlatformCode;
  maxBytes?: number;
  timeoutMs?: number;
  transport?: ImageTransport;
  resolver?: HostResolver;
};

const INSTAGRAM_CDN_SUFFIXES = ["cdninstagram.com", "fbcdn.net"];

export function isPrivateAddress(address: string): boolean {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return isPrivateAddress(mapped[1]!);
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number) as [number, number, number, number];
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  if (isIP(address) === 6) {
    const value = address.toLowerCase();
    return value === "::" || value === "::1" || /^f[cd]/.test(value) || /^fe[89ab]/.test(value) || value.startsWith("ff");
  }
  return true;
}

/** Synchronous, DNS-free validation of a source image URL. */
export function validateSourceImageUrl(value: string, platform?: LookPlatformCode): URL {
  if (value.length > 2048) throw new Error("이미지 URL이 너무 깁니다.");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("올바른 이미지 URL이 아닙니다."); }
  if (url.protocol !== "https:") throw new Error("이미지 URL은 HTTPS만 허용됩니다.");
  if (url.username || url.password) throw new Error("인증 정보가 포함된 이미지 URL은 허용되지 않습니다.");
  if (url.port && url.port !== "443") throw new Error("이미지 URL의 비표준 포트는 허용되지 않습니다.");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("내부 호스트의 이미지 URL은 허용되지 않습니다.");
  }
  if (isIP(host) && isPrivateAddress(host)) throw new Error("사설·루프백 주소의 이미지 URL은 허용되지 않습니다.");
  if (platform === "INSTAGRAM" && !INSTAGRAM_CDN_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    throw new Error("Instagram 이미지는 Instagram CDN(cdninstagram.com / fbcdn.net) URL만 허용됩니다.");
  }
  return url;
}

const defaultResolver: HostResolver = async (hostname) => (await dns.lookup(hostname, { all: true })).map((entry) => entry.address);

export function sniffImage(bytes: Uint8Array): SniffedImage | null {
  const b = Buffer.from(bytes.subarray(0, 16));
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { contentType: "image/jpeg", extension: "jpg" };
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { contentType: "image/png", extension: "png" };
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return { contentType: "image/webp", extension: "webp" };
  if (b.length >= 6 && ["GIF87a", "GIF89a"].includes(b.toString("ascii", 0, 6))) return { contentType: "image/gif", extension: "gif" };
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(b.toString("ascii", 8, 12))) return { contentType: "image/avif", extension: "avif" };
  return null;
}

/** Real transport: HTTPS only, no redirects, and the connect-time DNS answer is re-validated (anti DNS-rebinding). */
export const httpsImageTransport: ImageTransport = (url, { timeoutMs }) => new Promise((resolve, reject) => {
  const req = httpsRequest(url, {
    method: "GET", timeout: timeoutMs, headers: { accept: "image/*", "user-agent": "Mozilla/5.0 (compatible; LookImageArchiver/1.0)" },
    lookup: (hostname, options, callback) => dnsLookup(hostname, { ...options, all: false }, (error, address, family) => {
      if (error) return callback(error, address, family);
      if (isPrivateAddress(address)) return callback(new Error("private address blocked"), address, family);
      callback(null, address, family);
    })
  }, (res) => {
    const headers: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(res.headers)) headers[key] = Array.isArray(value) ? value.join(",") : value;
    resolve({ status: res.statusCode ?? 0, headers, body: res, destroy: () => res.destroy() });
  });
  req.on("timeout", () => req.destroy(new Error("timeout")));
  req.on("error", reject);
  req.end();
});

/** Fetch a temporary source image safely. Throws a generic, secret-free error on any failure. */
export async function fetchSourceImage(sourceUrl: string, options: FetchSourceImageOptions = {}): Promise<FetchedImage> {
  const url = validateSourceImageUrl(sourceUrl, options.platform);
  const maxBytes = options.maxBytes ?? MAX_LOOK_IMAGE_BYTES;
  const timeoutMs = options.timeoutMs ?? LOOK_IMAGE_FETCH_TIMEOUT_MS;
  const resolver = options.resolver ?? defaultResolver;
  const transport = options.transport ?? httpsImageTransport;
  let timer: NodeJS.Timeout | undefined;
  let response: TransportResponse | undefined;
  try {
    const addresses = isIP(url.hostname.replace(/^\[|\]$/g, "")) ? [url.hostname.replace(/^\[|\]$/g, "")] : await resolver(url.hostname);
    if (!addresses.length || addresses.some(isPrivateAddress)) throw new Error("이미지 호스트가 내부 주소로 확인되어 차단했습니다.");
    const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { response?.destroy(); reject(new Error("timeout")); }, timeoutMs); });
    const work = (async () => {
      response = await transport(url, { timeoutMs });
      if (response.status < 200 || response.status >= 300) throw new Error(`원본 이미지 응답 상태가 ${response.status}입니다.`);
      const declared = (response.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
      if (!declared.startsWith("image/")) throw new Error("이미지가 아닌 응답입니다.");
      const length = Number(response.headers["content-length"]);
      if (Number.isFinite(length) && length > maxBytes) throw new Error("이미지 용량이 허용 한도를 초과했습니다.");
      const chunks: Buffer[] = [];
      let total = 0;
      for await (const chunk of response.body) {
        total += chunk.byteLength;
        if (total > maxBytes) { response.destroy(); throw new Error("이미지 용량이 허용 한도를 초과했습니다."); }
        chunks.push(Buffer.from(chunk));
      }
      const bytes = Buffer.concat(chunks);
      const sniffed = sniffImage(bytes);
      if (!bytes.length || !sniffed) throw new Error("지원하지 않는 이미지 형식입니다.");
      return { ...sniffed, bytes };
    })();
    work.catch(() => undefined);
    return await Promise.race([work, deadline]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/[가-힣]/.test(message)) throw new Error(message);
    throw new Error(message === "timeout" ? "원본 이미지 요청 시간이 초과되었습니다." : "원본 이미지를 가져오지 못했습니다. 만료되었거나 접근할 수 없는 URL일 수 있습니다.");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
