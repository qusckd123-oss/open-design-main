type ProductLinkButtonProps = {
  url: string | null | undefined;
};

// Opens the real sales page for a STORE product in a new tab. Renders nothing
// when no URL is available (assortment/editorial-only rows, missing data).
export function ProductLinkButton({ url }: ProductLinkButtonProps) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded border border-line bg-white px-2 py-1 text-xs font-semibold text-signal hover:border-signal"
    >
      상품 보기 ↗
    </a>
  );
}
