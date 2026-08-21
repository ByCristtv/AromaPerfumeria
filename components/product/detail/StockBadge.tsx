"use client";

interface StockBadgeProps {
  stock: number;
}

/**
 * Availability, told with a dot and a word.
 *
 * The traffic-light palette (green / amber / red) is deliberately gone: on the
 * KROV ground it read as a system alert, and the red state was indistinguishable
 * from the brand's own accent. Availability is now carried by the dot's
 * intensity — a live pulse when stock is healthy, a static rose when it is
 * running out, and an unlit grey when it is gone.
 */
export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <Badge tone="text-krov-dust" dot="bg-krov-dust">
        Sin existencias
      </Badge>
    );
  }
  if (stock <= 5) {
    return (
      <Badge tone="text-krov-blush" dot="bg-krov-blood">
        Últimas {stock} unidades
      </Badge>
    );
  }
  return (
    <Badge tone="text-krov-ash" dot="bg-krov-blood krov-pulse">
      En existencia
    </Badge>
  );
}

function Badge({
  children,
  tone,
  dot,
}: {
  children: React.ReactNode;
  tone: string;
  dot: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] ${tone}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </span>
  );
}
