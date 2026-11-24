import { cn } from "@/lib/utils";

export type ClayColor = "lilac" | "mint" | "butter" | "guava" | "violet";
type Shape = "sphere" | "pill" | "ring" | "blob";

const tone = (c: ClayColor) => ({ "--c": `var(--${c})` }) as React.CSSProperties;

/** A single CSS-rendered clay object. `size` is the font-size that drives its em-based shading. */
export function Clay({
  shape = "sphere",
  color = "lilac",
  size = 48,
  className,
  style,
}: {
  shape?: Shape;
  color?: ClayColor;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      className={cn("clay", `clay-${shape}`, className)}
      style={{ ...tone(color), fontSize: size, width: shape === "pill" ? size * 2.4 : size, ...style }}
    />
  );
}

export function ClayCube({ color = "butter", size = 40, className }: { color?: ClayColor; size?: number; className?: string }) {
  return (
    <span aria-hidden className={cn("clay-cube", className)} style={{ ...tone(color), fontSize: size }}>
      <span />
      <span />
      <span />
    </span>
  );
}

export type BuddyKind = "penulis" | "desainer" | "brain" | "kasir";

const BUDDY: Record<BuddyKind, { body: ClayColor; prop: React.ReactNode }> = {
  penulis: {
    body: "butter",
    prop: <Clay shape="pill" color="guava" size={14} className="absolute -right-[18%] bottom-[14%] -rotate-[38deg]" />,
  },
  desainer: {
    body: "guava",
    prop: <Clay shape="ring" color="mint" size={22} className="absolute -right-[22%] -top-[6%]" />,
  },
  brain: {
    body: "lilac",
    prop: <ClayCube color="butter" size={13} className="absolute -top-[10%] left-[38%]" />,
  },
  kasir: {
    body: "mint",
    prop: <Clay shape="sphere" color="butter" size={16} className="absolute -right-[14%] top-[44%]" />,
  },
};

/** A clay crew member: a soft blob with a face and the tool of its trade. */
export function ClayBuddy({ kind, size = 64, className }: { kind: BuddyKind; size?: number; className?: string }) {
  const b = BUDDY[kind];
  return (
    <span aria-hidden className={cn("relative inline-block", className)} style={{ width: size, height: size }}>
      <Clay shape="blob" color={b.body} size={size} className="absolute inset-0" style={{ width: size, height: size / 1.1 }} />
      <span className="absolute flex gap-[18%]" style={{ left: "30%", top: "36%", width: "40%" }}>
        <span className="block aspect-square w-[22%] rounded-full bg-ink" />
        <span className="block aspect-square w-[22%] rounded-full bg-ink" />
      </span>
      <span
        className="absolute rounded-b-full border-ink"
        style={{ left: "42%", top: "52%", width: "16%", height: "8%", borderBottomWidth: Math.max(2, size / 28) }}
      />
      {b.prop}
    </span>
  );
}
