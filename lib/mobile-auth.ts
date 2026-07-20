import "server-only";
import { randomBytes } from "crypto";
import { getCreatorByAuthId, getCreatorByMobileToken, updateCreator } from "@/lib/store";
import { Creator } from "@/lib/types";

/** Verifies a Google ID token (from native Sign-In) and returns its claims.
 *  Uses Google's tokeninfo endpoint — validates signature + expiry server-side. */
export async function verifyGoogleIdToken(
  idToken: string
): Promise<{ sub: string; email: string } | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      exp?: string;
    };
    // token must be minted for our own OAuth client
    const allowed = new Set(
      [process.env.AUTH_GOOGLE_ID, process.env.GOOGLE_ANDROID_CLIENT_ID].filter(Boolean)
    );
    if (!data.aud || !allowed.has(data.aud)) return null;
    if (!data.sub) return null;
    if (data.exp && Number(data.exp) * 1000 < Date.now()) return null;
    return { sub: data.sub, email: data.email ?? "" };
  } catch {
    return null;
  }
}

/** Issues a fresh opaque session token for the app and stores it on the creator. */
export async function issueMobileToken(creatorId: string): Promise<string> {
  const token = `mob_${randomBytes(32).toString("hex")}`;
  await updateCreator(creatorId, (c) => {
    const tokens = c.mobileTokens ?? [];
    // keep the list bounded — most recent 5 devices
    c.mobileTokens = [token, ...tokens].slice(0, 5);
  });
  return token;
}

/** Resolves the creator behind an app request's `Authorization: Bearer` token. */
export async function creatorFromBearer(req: Request): Promise<Creator | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token.startsWith("mob_")) return null;
  return getCreatorByMobileToken(token);
}

/** login: Google token in → creator + session token out (existing accounts). */
export async function loginWithGoogle(
  idToken: string
): Promise<{ token: string; creator: Creator } | { error: string }> {
  const claims = await verifyGoogleIdToken(idToken);
  if (!claims) return { error: "invalid_token" };
  const creator = await getCreatorByAuthId(`google:${claims.sub}`);
  if (!creator) return { error: "no_account" };
  const token = await issueMobileToken(creator.id);
  return { token, creator };
}
