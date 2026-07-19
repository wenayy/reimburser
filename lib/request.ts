import "server-only";
import { createHmac } from "crypto";
import { headers } from "next/headers";

/** Vercel sets x-forwarded-for from the connection; client-sent values are stripped. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "local").split(",")[0].trim();
}

/** Salted hash so we can recognize/block repeat senders without ever storing raw IPs. */
export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? "reimburser-ip-salt";
  return createHmac("sha256", salt).update(ip).digest("hex").slice(0, 16);
}
