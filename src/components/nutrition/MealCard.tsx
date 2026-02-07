import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Meal } from "@/types/nutrition";
import { Link } from "react-router-dom";

const MealCard = ({ meal }: { meal: Meal }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {meal.time} — {meal.label}
          </p>
          <p className="font-medium text-sm leading-snug">{meal.description}</p>
          {meal.digestiveNote && (
            <p className="text-xs text-accent italic">{meal.digestiveNote}</p>
          )}
          {meal.recipeId && (
            <Link
              to={`/recetas/${meal.recipeId}`}
              className="text-xs text-primary hover:underline inline-block mt-1"
            >
              Ver receta completa
            </Link>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant="secondary" className="font-bold">
            {meal.protein}g prot
          </Badge>
          {meal.calories > 0 && (
            <span className="text-xs text-muted-foreground">{meal.calories} kcal</span>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default MealCard;
