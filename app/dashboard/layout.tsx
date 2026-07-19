import { ReactNode } from "react";
import { countDrafts, countPendingForCreator, runMaintenance } from "@/lib/store";
import { requireOnboarded } from "@/lib/auth";
import { deleteUpload } from "@/lib/uploads";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { PendingBadge } from "@/components/dashboard/PendingBadge";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const creator = await requireOnboarded();

  // queue housekeeping (expire stale claims, purge old rejects) piggybacks on
  // dashboard visits — every page under this layout sees a clean queue
  const orphanedProofs = await runMaintenance(creator.id);
  for (const url of orphanedProofs) await deleteUpload(url);

  const [pendingCount, draftCount] = await Promise.all([
    countPendingForCreator(creator.id),
    countDrafts(creator.id),
  ]);

  return (
    <div className="min-h-screen lg:flex">
      <AutoRefresh />
      <PendingBadge count={pendingCount} />
      <DashboardNav creator={creator} pendingCount={pendingCount} draftCount={draftCount} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 sm:py-10 pb-24 lg:pb-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
