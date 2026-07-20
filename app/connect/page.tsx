import { redirect } from "next/navigation";
import { getSessionCreator } from "@/lib/auth";
import { ConnectPhone } from "@/components/ConnectPhone";

export const dynamic = "force-dynamic";

/** Landed on from inside the app: hands the phone a capture key so bank alerts
 *  can flow to this account. Only reachable when signed in. */
export default async function ConnectPage() {
  const creator = await getSessionCreator();
  if (!creator) redirect("/login");
  return <ConnectPhone displayName={creator.displayName} />;
}
