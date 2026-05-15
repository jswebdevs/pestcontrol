import { cookies } from "next/headers";

const COOKIE_PREFIX = "pcr";

export async function getCustomerSession() {
  const c = cookies();
  const access = c.get(`${COOKIE_PREFIX}_customer_access`)?.value;
  if (!access) return null;
  try {
    const [, payloadB64] = access.split(".");
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (payload?.scope !== "CUSTOMER") return null;
    return payload as { sub: string; name?: string; email?: string; phone?: string };
  } catch {
    return null;
  }
}
