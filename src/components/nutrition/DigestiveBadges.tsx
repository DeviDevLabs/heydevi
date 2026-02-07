import { Badge } from "@/components/ui/badge";
import { DigestiveTags, digestiveScoreLabel } from "@/lib/digestiveUtils";
import { Leaf, Flame, AlertTriangle } from "lucide-react";

interface Props {
  tags: DigestiveTags;
  compact?: boolean;
}

const DigestiveBadges = ({ tags, compact = false }: Props) => {
  const { label, color } = digestiveScoreLabel(tags.digestiveScore);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-xs font-medium ${color}`}>
          {tags.digestiveScore}/10 {label}
        </span>
        {tags.hasLactose && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Lácteos</Badge>}
        {tags.hasLegumes && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Legumbres</Badge>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary" className={`text-xs gap-1 ${color}`}>
        <Leaf className="w-3 h-3" />
        {tags.digestiveScore}/10 — {label}
      </Badge>
      {tags.highFiber && <Badge variant="outline" className="text-xs">Alta fibra</Badge>}
      {tags.lowFiber && <Badge variant="outline" className="text-xs">Baja fibra</Badge>}
      {tags.highFat && <Badge variant="outline" className="text-xs gap-1"><Flame className="w-3 h-3" />Alta grasa</Badge>}
      {tags.hasLactose && <Badge variant="outline" className="text-xs">Lácteos</Badge>}
      {tags.hasGluten && <Badge variant="outline" className="text-xs">Gluten</Badge>}
      {tags.hasLegumes && <Badge variant="outline" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" />Legumbres</Badge>}
      {tags.hasCruciferous && <Badge variant="outline" className="text-xs">Crucíferas</Badge>}
      {tags.isSpicy && <Badge variant="destructive" className="text-xs">Picante</Badge>}
    </div>
  );
};

export default DigestiveBadges;
