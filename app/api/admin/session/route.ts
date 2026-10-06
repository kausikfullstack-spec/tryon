import { cookies } from "next/headers";
import { matchesPassword, sessionToken, sameOrigin } from "@/lib/admin";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  if (!process.env.ADMIN_PASSWORD)
    return Response.json(
      { error: "Set ADMIN_PASSWORD in .env.local and restart the server." },
      { status: 503 },
    );
  const form = await request.formData();
  if (!matchesPassword(String(form.get("password") || "")))
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  (await cookies()).set(
    "glasses-admin",
    sessionToken(Date.now() + 8 * 60 * 60 * 1000),
    {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 28800,
    },
  );
  return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  (await cookies()).delete("glasses-admin");
  return Response.json({ ok: true });
}
