import { Progress } from "@/components/ui/progress";

interface ProteinBarProps {
  current: number;
  target: number;
}

const ProteinBar = ({ current, target }: ProteinBarProps) => {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-2xl font-bold text-foreground">{current}g</span>
        <span className="text-sm text-muted-foreground">Meta: {target}g proteina</span>
      </div>
      <Progress value={percentage} className="h-3" />
      <p className="text-xs text-muted-foreground text-right">
        {percentage >= 100
          ? "Meta alcanzada"
          : `Faltan ${target - current}g para la meta`}
      </p>
    </div>
  );
};

export default ProteinBar;
