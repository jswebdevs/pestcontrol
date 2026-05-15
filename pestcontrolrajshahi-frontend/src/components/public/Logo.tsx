import Link from "next/link";
import { CldImage } from "@/components/shared/CldImage";

interface LogoProps {
  publicId?: string | null;
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  alt?: string;
}

/**
 * Brand logo. When a Cloudinary publicId is configured (Settings → Header → logo),
 * shows the image. Otherwise renders a clean monogram badge — no text.
 */
export function Logo({ publicId, href = "/", className = "", size = "md", alt = "Logo" }: LogoProps) {
  const dim = size === "sm" ? { w: 40, h: 40 } : size === "lg" ? { w: 72, h: 72 } : { w: 56, h: 56 };
  const boxSize = size === "sm" ? "h-9" : size === "lg" ? "h-14" : "h-11";

  if (publicId) {
    return (
      <Link href={href} className={`inline-flex items-center ${className}`}>
        <CldImage
          publicId={publicId}
          alt={alt}
          w={dim.w}
          h={dim.h}
          crop="fit"
          className={`${boxSize} w-auto object-contain`}
        />
      </Link>
    );
  }

  // Premium fallback monogram — image-style mark, no text alongside.
  const mono = size === "sm" ? "size-9 text-base" : size === "lg" ? "size-14 text-2xl" : "size-11 text-lg";
  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label={alt}>
      <span
        className={`${mono} relative rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground font-heading font-extrabold grid place-items-center shadow-sm ring-1 ring-primary/20`}
      >
        <span className="relative z-10">PCR</span>
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/10 to-white/0" />
      </span>
    </Link>
  );
}
