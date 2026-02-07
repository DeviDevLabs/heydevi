import { Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { getDigestiveTags } from "@/lib/digestiveUtils";
import DigestiveBadges from "@/components/nutrition/DigestiveBadges";

const Recipes = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-serif">Recetas</h1>
      <p className="text-muted-foreground text-sm mt-1">
        {recipes.length} recetas vegetarianas de alta proteina
      </p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      {recipes.map((recipe) => {
        const digestiveTags = getDigestiveTags(recipe);
        return (
          <Link key={recipe.id} to={`/recetas/${recipe.id}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold leading-tight">{recipe.name}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="font-bold">
                    {recipe.totalProtein}g proteina
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prepTime} min
                  </Badge>
                  {recipe.servings > 1 && (
                    <Badge variant="outline">{recipe.servings} porc.</Badge>
                  )}
                </div>
                <DigestiveBadges tags={digestiveTags} compact />
                <div className="flex gap-2 flex-wrap">
                  {recipe.tags.map((t) => (
                    <span key={t} className="text-xs text-muted-foreground">#{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  </div>
);

export default Recipes;
