import { cookies } from "next/headers";

const COOKIE_PREFIX = "pcr";

export async function getAdminSession() {
  const c = await cookies();
  const access = c.get(`${COOKIE_PREFIX}_admin_access`)?.value;
  if (!access) return null;
  try {
    const [, payloadB64] = access.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (payload?.scope !== "ADMIN") return null;
    return payload as { sub: string; name?: string; role: string; email?: string };
  } catch {
    return null;
  }
}
