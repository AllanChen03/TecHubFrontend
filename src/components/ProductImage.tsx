import { cn } from "@/lib/utils";

export function isImageUrl(s: string) {
  return s?.startsWith("data:") || s?.startsWith("http") || s?.startsWith("/");
}

export function ProductImage({
  src,
  className,
  emojiClassName,
  alt,
}: {
  src: string;
  className?: string;
  emojiClassName?: string;
  alt: string;
}) {
  if (isImageUrl(src)) {
    return <img src={src} alt={alt} className={cn("w-full h-full object-cover", className)} />;
  }
  // Emoji decorativo: el alt textual lo aporta el contenedor con aria-label
  return (
    <span className={emojiClassName} role="img" aria-label={alt}>
      {src}
    </span>
  );
}
