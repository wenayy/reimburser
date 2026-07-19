import Link from "next/link";
import { ChevronRight, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui";

/** Way into /help from inside the dashboard — the sidebar link is desktop-only,
 *  so pages render this card where mobile users can reach it. */
export function HelpCard() {
  return (
    <Link href="/help" className="block">
      <Card className="flex items-center gap-3 p-4 sm:p-5 transition-colors hover:bg-zinc-50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <HelpCircle size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-zinc-900">Help &amp; support</div>
          <div className="mt-0.5 text-xs text-zinc-400">
            Questions, feedback, or something not working? We&apos;re here.
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0 text-zinc-300" />
      </Card>
    </Link>
  );
}
