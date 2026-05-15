import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1";

export async function POST(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });
  } catch {}
  const res = NextResponse.redirect(new URL("/admin/login", req.url));
  for (const sc of ["admin", "customer"]) {
    for (const k of ["access", "refresh"]) {
      res.cookies.set(`pcr_${sc}_${k}`, "", { maxAge: 0, path: "/" });
    }
  }
  return res;
}
