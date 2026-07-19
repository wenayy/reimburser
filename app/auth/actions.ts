"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { getSession } from "@/lib/auth";
import { getCreatorByAuthId, saveCreator, uid, usernameTaken } from "@/lib/store";
import { Creator, PaymentMethodType } from "@/lib/types";
import { composeMethod } from "@/lib/payments";
import { saveImage } from "@/lib/uploads";

export type AuthState = { error: string };

const RESERVED_USERNAMES = new Set([
  "dashboard", "login", "signup", "onboarding", "uploads", "api", "admin",
  "settings", "about", "help", "support", "terms", "privacy", "demo", "faq",
  "refunds", "contact", "icons", "manifest",
]);

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

/** Creates (or completes) the creator record for the signed-in user. */
export async function completeOnboarding(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session?.uid) redirect("/login");
  const authId = session.uid;

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const avatarEmoji = String(formData.get("avatarEmoji") ?? "🙂");
  const bio = String(formData.get("bio") ?? "").trim();

  if (!/^[a-z0-9-]{3,20}$/.test(username))
    return { error: "Username must be 3–20 characters: letters, numbers, or dashes." };
  if (RESERVED_USERNAMES.has(username)) return { error: "That username is reserved — pick another." };
  if (!displayName) return { error: "Tell supporters your name." };

  let raw: { type: PaymentMethodType; fields: Record<string, string> }[] = [];
  try {
    raw = JSON.parse(String(formData.get("paymentMethods") ?? "[]"));
  } catch {
    raw = [];
  }
  const methods = (Array.isArray(raw) ? raw : [])
    .map((m) => {
      const composed = m?.type && m.fields ? composeMethod(m.type, m.fields) : null;
      return composed ? { type: m.type, ...composed } : null;
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  // every creator starts with the code-only gift card — it needs no details,
  // and it keeps pages payable for strangers while UPI stays protected
  if (!methods.some((m) => m.type === "amazon_gc")) {
    const gc = composeMethod("amazon_gc", {});
    if (gc) methods.push({ type: "amazon_gc" as PaymentMethodType, ...gc });
  }
  if (methods.length === 0)
    return { error: "Add at least one payment method so supporters can actually pay you." };

  if (await usernameTaken(username, authId)) return { error: "That username is taken." };

  const avatarImage = await saveImage(formData.get("avatarFile"), "avatar");
  const email = session.user?.email ?? "";

  let c = await getCreatorByAuthId(authId);
  if (!c) {
    c = {
      id: uid("c"),
      authId,
      username,
      email,
      createdAt: new Date().toISOString(),
      onboarded: false,
      displayName: "",
      bio: "",
      avatarEmoji: "🙂",
      paymentMethods: [],
      preferences: { autoImport: true, autoPublish: false, allowProofUpload: true, requireProof: true, showLeaderboard: true, protectUpi: true },
    } satisfies Creator;
  }
  c.username = username;
  c.email = email || c.email;
  c.displayName = displayName;
  c.avatarEmoji = avatarEmoji;
  if (avatarImage) c.avatarImage = avatarImage;
  c.bio = bio || `Hi, I'm ${displayName}. I share my daily expenses transparently — cover one if my work helped you.`;
  for (const m of methods) {
    c.paymentMethods.push({
      id: uid("pm"),
      type: m.type,
      label: m.label,
      value: m.value,
      details: m.details,
      enabled: true,
    });
  }
  c.onboarded = true;
  try {
    await saveCreator(c);
  } catch {
    // unique-constraint race on username: someone claimed it between check and save
    return { error: "That username is taken." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
