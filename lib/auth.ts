import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCreatorByAuthId } from "./store";
import { Creator } from "./types";

/** The signed-in Auth.js session, or null. */
export async function getSession() {
  const session = await auth();
  return session?.uid ? session : null;
}

/** The local creator record linked to the signed-in user, or null. */
export async function getSessionCreator(): Promise<Creator | null> {
  const session = await getSession();
  if (!session?.uid) return null;
  return getCreatorByAuthId(session.uid);
}

/** Guard for dashboard pages: must be signed in AND onboarded. */
export async function requireOnboarded(): Promise<Creator> {
  const session = await getSession();
  if (!session?.uid) redirect("/login");
  const creator = await getCreatorByAuthId(session.uid);
  if (!creator || !creator.onboarded) redirect("/onboarding");
  return creator;
}
