import { Progress } from "@/components/ui/progress";
import { successRateTone } from "@/utils";

export function SuccessRateCell({ rate }: { rate: number }) {
  const tone = successRateTone(rate);
  return (
    <div className="flex items-center gap-2">
      <Progress value={rate} barClassName={tone.bar} className="w-20" />
      <span className={`font-mono text-xs font-bold ${tone.text}`}>{rate}%</span>
    </div>
  );
}
