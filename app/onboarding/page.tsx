import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCreatorByAuthId } from "@/lib/store";
import { OnboardingWizard } from "@/components/auth/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.uid) redirect("/login");

  const creator = await getCreatorByAuthId(session.uid);
  if (creator?.onboarded) redirect("/dashboard");

  const suggested = (
    creator?.username ??
    session.user?.email?.split("@")[0] ??
    session.user?.name ??
    ""
  )
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 20);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <OnboardingWizard
        initialUsername={suggested}
        initialName={session.user?.name ?? ""}
      />
    </div>
  );
}
