import { requireOnboarded } from "@/lib/auth";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const creator = await requireOnboarded();
  return <SettingsPanel creator={creator} />;
}
