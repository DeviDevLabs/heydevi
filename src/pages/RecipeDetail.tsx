import { useParams, Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";

const MULTIPLIERS = [0.5, 1, 1.5, 2];

const RecipeDetail = () => {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);
  const [multiplier, setMultiplier] = useState(1);

  if (!recipe) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Receta no encontrada</p>
        <Link to="/recetas" className="text-primary hover:underline text-sm mt-2 inline-block">
          Volver a recetas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/recetas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Recetas
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-serif">{recipe.name}</h1>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="secondary" className="font-bold">
            {Math.round(recipe.totalProtein * multiplier)}g proteina
          </Badge>
          <Badge variant="outline">
            {Math.round(recipe.totalCalories * multiplier)} kcal
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="w-3 h-3" />
            {recipe.prepTime} min
          </Badge>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Porciones</p>
        <div className="flex gap-2">
          {MULTIPLIERS.map((m) => (
            <Button
              key={m}
              size="sm"
              variant={multiplier === m ? "default" : "outline"}
              onClick={() => setMultiplier(m)}
            >
              {m}x
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ingredientes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <span>{ing.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round(ing.grams * multiplier)}g
                  <span className="ml-2">({Math.round(ing.protein * multiplier)}g prot)</span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Preparacion</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {recipe.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-xs">
            #{t}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default RecipeDetail;
