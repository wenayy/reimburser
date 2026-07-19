/**
 * AI description generator.
 *
 * MVP implementation is deterministic and template-based so the app runs
 * with zero API keys. To upgrade to a real LLM, replace `generateDescription`
 * with a call through the Vercel AI Gateway, e.g.:
 *
 *   import { generateText } from "ai";
 *   const { text } = await generateText({
 *     model: "anthropic/claude-haiku-4-5",
 *     prompt: `Turn this raw card transaction into one warm, human sentence
 *              a creator would write on their public expense page:
 *              "${rawText}" for ₹${amount} at ${hour}:00. No hashtags.`,
 *   });
 */

const TEMPLATES: Record<string, ((ctx: Ctx) => string)[]> = {
  Coffee: [
    ({ daypart }) => `Grabbed a ${daypart} coffee while working.`,
    () => `Coffee run to keep the work session going.`,
    ({ daypart }) => `Stopped for a ${daypart} coffee between tasks.`,
  ],
  Transport: [
    () => `Travelled across town for today's meetings.`,
    ({ daypart }) => `Took a ride to a ${daypart} shoot.`,
    () => `Cab fare for running work errands.`,
  ],
  Food: [
    ({ daypart }) => `Ordered ${daypart === "morning" ? "breakfast" : daypart === "afternoon" ? "lunch" : "dinner"} on a long working day.`,
    () => `Quick meal between recording sessions.`,
  ],
  Groceries: [
    () => `Weekly grocery restock delivered home.`,
    () => `Picked up essentials for the week.`,
  ],
  Shopping: [
    ({ merchant }) => `Picked up some gear from ${merchant} for upcoming projects.`,
    () => `Bought supplies for the studio setup.`,
  ],
  Subscription: [
    ({ merchant }) => `Monthly ${merchant} subscription renewed.`,
    ({ merchant }) => `${merchant} plan for research and downtime.`,
  ],
  Software: [
    ({ merchant }) => `${merchant} subscription that powers my daily workflow.`,
    ({ merchant }) => `Paid for ${merchant} — an essential tool for my work.`,
  ],
  Utilities: [
    () => `Monthly internet and phone recharge to stay online.`,
  ],
  Travel: [
    () => `Booked travel for an upcoming creator event.`,
  ],
  Other: [
    ({ merchant }) => `Everyday expense at ${merchant}.`,
    ({ merchant }) => `Small purchase at ${merchant} during the workday.`,
  ],
};

interface Ctx {
  merchant: string;
  daypart: "morning" | "afternoon" | "evening";
}

function daypartOf(date: Date): Ctx["daypart"] {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function generateDescription(
  merchant: string,
  category: string,
  amount: number,
  date: Date
): string {
  const templates = TEMPLATES[category] ?? TEMPLATES.Other;
  // Deterministic pick so the same expense always gets the same text
  const seed = Math.floor(amount + date.getTime() / 60000) % templates.length;
  return templates[seed]({ merchant, daypart: daypartOf(date) });
}
