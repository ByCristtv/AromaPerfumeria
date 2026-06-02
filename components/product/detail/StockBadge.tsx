"use client";

interface StockBadgeProps {
  stock: number;
}

export default function StockBadge({ stock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <Badge color="#b91c1c" bg="rgba(185,28,28,0.08)" border="rgba(185,28,28,0.25)">
        Sin existencias
      </Badge>
    );
  }
  if (stock <= 5) {
    return (
      <Badge color="#92400e" bg="rgba(217,119,6,0.10)" border="rgba(217,119,6,0.30)">
        Últimas {stock} unidades
      </Badge>
    );
  }
  return (
    <Badge color="#166534" bg="rgba(22,101,52,0.08)" border="rgba(22,101,52,0.22)">
      En existencia
    </Badge>
  );
}

function Badge({
  children,
  color,
  bg,
  border,
}: {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
      style={{ color, background: bg, border: `1px solid ${border}` }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}
