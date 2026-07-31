import { NextResponse } from "next/server";
import { countPendingForCreator, getCreatorByDeviceKey, getCreatorByMobileToken } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Lightweight count of claims awaiting the creator's verification — the app
 *  polls this to badge its icon and post a "N to review" notification. */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const key = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (key.length < 20) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const creator = key.startsWith("mob_")
    ? await getCreatorByMobileToken(key)
    : await getCreatorByDeviceKey(key);
  if (!creator) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const pending = await countPendingForCreator(creator.id);
  return NextResponse.json({ pending });
}
