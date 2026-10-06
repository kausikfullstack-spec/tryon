import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export function matchesPassword(value: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  const a = Buffer.from(value),
    b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function sessionToken(expires: number) {
  return `${expires}.${createHmac("sha256", process.env.ADMIN_PASSWORD!).update(`admin:${expires}`).digest("hex")}`;
}
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const token = (await cookies()).get("glasses-admin")?.value;
  if (!token) return false;
  const expires = Number(token.split(".")[0]);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(sessionToken(expires)),
    actual = Buffer.from(token);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
