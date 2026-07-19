export function Avatar({
  emoji,
  image,
  size,
}: {
  emoji: string;
  image?: string;
  size: number;
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover border border-zinc-200/70 shadow-sm shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-white border border-zinc-200/70 shadow-sm shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {emoji}
    </div>
  );
}
