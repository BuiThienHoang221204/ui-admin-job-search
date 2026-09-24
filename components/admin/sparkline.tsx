import { cn } from "@/utils";

const W = 120;
const H = 32;
const PAD = 3;

// Đường xu hướng không trục: nét 2px, vệt nền ~10%, chấm ở điểm cuối để mắt biết "bây giờ" ở đâu.
export function Sparkline({
  values,
  label,
  className,
}: {
  values: number[];
  label: string;
  className?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(0, ...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [
    PAD + (index / (values.length - 1)) * (W - PAD * 2),
    H - PAD - ((value - min) / span) * (H - PAD * 2),
  ]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = points[points.length - 1];
  const area = `${PAD},${H - PAD} ${line} ${lastX.toFixed(1)},${H - PAD}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <title>{label}</title>
      <polygon points={area} fill="currentColor" opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
    </svg>
  );
}
