"use client";

import { useEffect, useState } from "react";

type ProductImageProps = {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
};

// Clicking a product image opens a centered, dimmed lightbox at the largest
// available resolution. Closes on the X button, Escape, or an outside click.
export function ProductImage({ src, alt, size = "md" }: ProductImageProps) {
  const [open, setOpen] = useState(false);
  const sizeClass = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-48 w-48"
  }[size];

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => src && setOpen(true)}
        className={`${sizeClass} shrink-0 overflow-hidden rounded border border-line bg-slate-100 ${src ? "cursor-zoom-in" : "cursor-default"}`}
        aria-label={src ? `${alt} 이미지 확대` : alt}
        disabled={!src}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs text-muted">NO IMG</div>
        )}
      </button>
      {open && src ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-h-full max-w-full" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="absolute -right-3 -top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-lg font-semibold text-ink shadow-subtle"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-[85vh] max-w-[90vw] rounded bg-white object-contain" />
          </div>
        </div>
      ) : null}
    </>
  );
}
