import type { ImgHTMLAttributes } from "react";
/** Locally generated responsive WebP sources; uploaded data URLs remain session-only. */
export function Photo({
  src,
  alt = "",
  sizes = "(max-width: 760px) 50vw, 350px",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const local =
    typeof src === "string" &&
    src.startsWith("/images/") &&
    src.endsWith(".jpg");
  return (
    <img
      {...props}
      alt={alt}
      src={local ? src.replace(".jpg", "-700.webp") : src}
      srcSet={
        local
          ? [96, 350, 700]
              .map((w) => `${src.replace(".jpg", `-${w}.webp`)} ${w}w`)
              .join(", ")
          : undefined
      }
      sizes={local ? sizes : undefined}
    />
  );
}
