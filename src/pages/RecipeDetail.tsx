import { useParams, Link } from "react-router-dom";
import { recipes } from "@/data/recipes";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { getDigestiveTags } from "@/lib/digestiveUtils";
import DigestiveBadges from "@/components/nutrition/DigestiveBadges";

const MULTIPLIERS = [0.5, 1, 1.5, 2];

const RecipeDetail = () => {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id);
  const [multiplier, setMultiplier] = useState(1);

  const digestiveTags = useMemo(() => (recipe ? getDigestiveTags(recipe) : { highFiber: false, lowFiber: false, highFat: false, lowFat: false, hasLactose: false, hasGluten: false, hasLegumes: false, hasCruciferous: false, isSpicy: false, digestiveScore: 5 } as import("@/lib/digestiveUtils").DigestiveTags), [recipe?.id]);

  const totalProteinRounded = useMemo(
    () => Math.round((recipe?.totalProtein ?? 0) * multiplier),
    [recipe?.totalProtein, multiplier]
  );

  const totalCaloriesRounded = useMemo(
    () => Math.round((recipe?.totalCalories ?? 0) * multiplier),
    [recipe?.totalCalories, multiplier]
  );

  const ingredientRows = useMemo(() => {
    if (!recipe) return [] as Array<{ name: string; grams: number; protein: number }>;

    const exactGrams = recipe.ingredients.map((ing) => ing.grams * multiplier);
    const exactProtein = recipe.ingredients.map((ing) => ing.protein * multiplier);

    const roundedGrams = exactGrams.map((g) => Math.round(g));
    const roundedProtein = exactProtein.map((p) => Math.round(p));

    const expectedTotalGrams = Math.round(recipe.ingredients.reduce((s, i) => s + i.grams, 0) * multiplier);
    const expectedTotalProtein = Math.round(recipe.ingredients.reduce((s, i) => s + i.protein, 0) * multiplier);

    const sumRoundedGrams = roundedGrams.reduce((s, v) => s + v, 0);
    const sumRoundedProtein = roundedProtein.reduce((s, v) => s + v, 0);

    const leftoverGrams = expectedTotalGrams - sumRoundedGrams;
    const leftoverProtein = expectedTotalProtein - sumRoundedProtein;

    const rows = recipe.ingredients.map((ing, i) => ({
      name: ing.name,
      grams: Math.max(0, roundedGrams[i]),
      protein: Math.max(0, roundedProtein[i]),
    }));

    if (leftoverGrams !== 0 || leftoverProtein !== 0) {
      rows.push({ name: "Fondo", grams: leftoverGrams, protein: leftoverProtein });
    }

    return rows;
  }, [recipe?.id, recipe?.ingredients, multiplier]);

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
            {totalProteinRounded}g proteina
          </Badge>
          <Badge variant="outline">
            {totalCaloriesRounded} kcal
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
            {ingredientRows.map((row, i) => (
              <li
                key={`${i}-${row.name}`}
                className="flex justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
              >
                <span>{row.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {row.grams}g
                  <span className="ml-2">({row.protein}g prot)</span>
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Perfil digestivo</CardTitle>
        </CardHeader>
        <CardContent>
          <DigestiveBadges tags={digestiveTags} />
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
