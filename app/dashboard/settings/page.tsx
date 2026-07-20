import { requireOnboarded } from "@/lib/auth";
import { SettingsPanel } from "@/components/dashboard/SettingsPanel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const creator = await requireOnboarded();
  // strip secrets before handing the creator to a client component — the
  // capture device key and mobile login tokens must never reach the browser
  const { deviceKey, mobileTokens, ...safe } = creator;
  void mobileTokens;

  // auto-capture needs the native Android app, which isn't published yet —
  // only show it to test accounts until it's live on the Play Store
  const testers = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const showAutoCapture = testers.includes(creator.email.toLowerCase());

  return (
    <SettingsPanel
      creator={safe}
      phoneConnected={!!deviceKey}
      showAutoCapture={showAutoCapture}
    />
  );
}
