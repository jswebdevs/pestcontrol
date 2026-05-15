const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";

export function cld(
  publicId: string,
  opts: { w?: number; h?: number; type?: "image" | "video"; crop?: string } = {},
) {
  if (!publicId) return "";
  // Pass through full URLs (legacy data)
  if (publicId.startsWith("http")) return publicId;
  const { w, h, type = "image", crop = "limit" } = opts;
  const t = ["q_auto", "f_auto", w && `w_${w}`, h && `h_${h}`, `c_${crop}`]
    .filter(Boolean)
    .join(",");
  return `https://res.cloudinary.com/${CLOUD}/${type}/upload/${t}/${publicId}`;
}
