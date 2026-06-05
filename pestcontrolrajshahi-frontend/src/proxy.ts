import { NextResponse, NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Slug-redirect proxy for /services/[slug]. If a service has been renamed,
// the backend's slug-redirects table returns the new slug and we 301 to it.
// (The /projects route family was retired — we run a Gallery, not a portfolio.)
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = /^\/services\/([^/]+)$/.exec(pathname);
  if (!match) return NextResponse.next();
  const [, slug] = match;
  try {
    const res = await fetch(`${API_URL}/slug-redirects/services/${slug}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const newSlug = data?.data?.newSlug || data?.newSlug;
      if (newSlug) {
        const url = req.nextUrl.clone();
        url.pathname = `/services/${newSlug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  } catch {
    // ignore
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/services/:slug"],
};
