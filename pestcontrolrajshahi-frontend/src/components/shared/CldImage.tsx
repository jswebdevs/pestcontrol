import { cld } from "@/lib/cloudinary";
import { ImageIcon } from "lucide-react";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  publicId?: string | null;
  alt: string;
  w?: number;
  h?: number;
  crop?: string;
}

/**
 * Renders a Cloudinary image, or a placeholder showing the target dimensions
 * when no publicId is set. Pass `w`/`h` to declare the slot's intended size
 * (e.g. <CldImage w={1200} h={600} />).
 */
export function CldImage({ publicId, alt, w = 1200, h, crop = "limit", className, ...rest }: Props) {
  if (!publicId) {
    const aspect = h ? `${w}/${h}` : "16/9";
    const display = h ? `${w} × ${h}` : `${w} × auto`;
    return (
      <div
        className={`bg-muted text-muted-foreground border border-dashed border-border/70 flex flex-col items-center justify-center gap-1 ${className ?? ""}`}
        style={{ aspectRatio: aspect }}
        aria-label={alt}
        role="img"
      >
        <ImageIcon className="size-6 opacity-50" aria-hidden="true" />
        <span className="text-xs font-mono opacity-70">{display}</span>
        {alt ? (
          <span className="text-[10px] opacity-50 px-2 text-center max-w-full truncate">
            {alt}
          </span>
        ) : null}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cld(publicId, { w, h, crop })}
      alt={alt}
      className={className}
      loading="lazy"
      {...rest}
    />
  );
}
