import Link from "next/link";

/** Receipt + heart inside a progress arc — the product in one mark.
 *  The arc draws in on load; the heart beats (see globals.css). */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        <linearGradient id="logo-grad" x1="6" y1="44" x2="58" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="0.55" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* progress arc, gap at the bottom */}
      <circle
        className="logo-arc"
        cx="32"
        cy="31"
        r="27"
        stroke="url(#logo-grad)"
        strokeWidth="5"
        strokeLinecap="round"
        transform="rotate(122 32 31)"
      />
      {/* receipt with folded corner and torn bottom */}
      <path
        d="M23 15h12l7 7v25l-3.2-2.7L35.6 47l-3.2-2.7L29.2 47 26 44.3 23 47V15Z"
        stroke="#18181b"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="#fafafa"
      />
      <path d="M35 15v7h7" stroke="#18181b" strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 26h8M28 31h10M28 36h4" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
      {/* heart */}
      <path
        className="logo-heart"
        d="M39.5 33.6c1.5-1.5 3.9-1.5 5.4 0 .3.3.8.3 1.1 0 1.5-1.5 3.9-1.5 5.4 0s1.5 3.9 0 5.4l-5.2 5.2c-.5.5-1.2.5-1.7 0l-5-5.2c-1.5-1.5-1.5-3.9 0-5.4Z"
        fill="#6d5cf6"
      />
    </svg>
  );
}

/** Mark + wordmark, linking home. Use `tagline` on roomy surfaces. */
export function Logo({
  size = 36,
  tagline = false,
  href = "/",
  wordmarkClass = "text-xl",
}: {
  size?: number;
  tagline?: boolean;
  href?: string;
  wordmarkClass?: string;
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <LogoMark size={size} />
      <span className="leading-none">
        <span
          className={`block font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-700 transition-colors ${wordmarkClass}`}
        >
          Reimburser
        </span>
        {tagline && (
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Real expenses. Real support.
          </span>
        )}
      </span>
    </Link>
  );
}
