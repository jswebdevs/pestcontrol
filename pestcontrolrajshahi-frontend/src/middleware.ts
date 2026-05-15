import { NextResponse, NextRequest } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Only check /services/[slug] and /projects/[slug]
  const match = /^\/(services|projects)\/([^/]+)$/.exec(pathname);
  if (!match) return NextResponse.next();
  const [, type, slug] = match;
  try {
    const res = await fetch(`${API_URL}/slug-redirects/${type}/${slug}`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const newSlug = data?.data?.newSlug || data?.newSlug;
      if (newSlug) {
        const url = req.nextUrl.clone();
        url.pathname = `/${type}/${newSlug}`;
        return NextResponse.redirect(url, 301);
      }
    }
  } catch {
    // ignore
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/services/:slug", "/projects/:slug"],
};
