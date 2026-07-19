import { ImageResponse } from "next/og";

// App icons rendered from the real logo mark (components/Logo.tsx), frozen at
// its resting animation state — same artwork on the site and the home screen.
// Full-bleed light tile: the OS applies its own corner rounding / mask.

const SIZES = new Set(["180", "192", "512"]);

// static copy of LogoMark: arc gap via dasharray (see .logo-arc in globals.css)
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="g" x1="6" y1="44" x2="58" y2="24" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="0.55" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="31" r="27" stroke="url(#g)" stroke-width="5" stroke-linecap="round"
    stroke-dasharray="170" stroke-dashoffset="40" transform="rotate(122 32 31)"/>
  <path d="M23 15h12l7 7v25l-3.2-2.7L35.6 47l-3.2-2.7L29.2 47 26 44.3 23 47V15Z"
    stroke="#18181b" stroke-width="3" stroke-linejoin="round" fill="#fafafa"/>
  <path d="M35 15v7h7" stroke="#18181b" stroke-width="3" stroke-linejoin="round"/>
  <path d="M28 26h8M28 31h10M28 36h4" stroke="#18181b" stroke-width="3" stroke-linecap="round"/>
  <path d="M39.5 33.6c1.5-1.5 3.9-1.5 5.4 0 .3.3.8.3 1.1 0 1.5-1.5 3.9-1.5 5.4 0s1.5 3.9 0 5.4l-5.2 5.2c-.5.5-1.2.5-1.7 0l-5-5.2c-1.5-1.5-1.5-3.9 0-5.4Z"
    fill="#6d5cf6"/>
</svg>`;

const LOGO_SRC = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  // mark at 66% keeps it inside the maskable safe zone (center 80%)
  const mark = Math.round(px * 0.66);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_SRC} width={mark} height={mark} alt="" />
      </div>
    ),
    { width: px, height: px }
  );
}
