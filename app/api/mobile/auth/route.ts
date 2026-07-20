import { NextResponse } from "next/server";
import { loginWithGoogle } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

/** POST { idToken } — native Google Sign-In exchange. Returns a session token
 *  the app stores and sends as Bearer on every later call, plus a small
 *  profile for the home screen. Existing (web-onboarded) accounts only. */
export async function POST(req: Request) {
  let body: { idToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const idToken = String(body.idToken ?? "");
  if (!idToken) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const result = await loginWithGoogle(idToken);
  if ("error" in result) {
    const status = result.error === "no_account" ? 404 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }

  const c = result.creator;
  return NextResponse.json({
    token: result.token,
    profile: {
      username: c.username,
      displayName: c.displayName,
      avatarEmoji: c.avatarEmoji,
      avatarImage: c.avatarImage ?? null,
    },
  });
}
