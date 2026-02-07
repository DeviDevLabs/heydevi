import { useMemo } from "react";
import { weeklyPlan } from "@/data/mealPlan";
import { supplements } from "@/data/supplements";
import { getDayTotalProtein, getDayTotalCalories } from "@/lib/nutritionUtils";
import ProteinBar from "@/components/nutrition/ProteinBar";
import MealCard from "@/components/nutrition/MealCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const PROTEIN_TARGET = 100;

const Dashboard = () => {
  const dayName = DAYS[new Date().getDay()];

  const todayPlan = useMemo(
    () => weeklyPlan.find((d) => d.dayName === dayName) || weeklyPlan[0],
    [dayName]
  );

  const totalProtein = getDayTotalProtein(todayPlan);
  const totalCalories = getDayTotalCalories(todayPlan);

  const todayFormatted = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif capitalize">{todayFormatted}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tu plan nutricional del dia
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Calorias</p>
            <p className="text-2xl font-bold mt-1">{totalCalories}</p>
            <p className="text-xs text-muted-foreground">kcal estimadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Comidas</p>
            <p className="text-2xl font-bold mt-1">{todayPlan.meals.length}</p>
            <p className="text-xs text-muted-foreground">ingestas hoy</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <ProteinBar current={totalProtein} target={PROTEIN_TARGET} />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Comidas del dia</h2>
        {todayPlan.meals.map((meal, i) => (
          <MealCard key={i} meal={meal} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Suplementos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {supplements.map((s) => (
            <div key={s.id} className="flex items-start gap-3">
              <Checkbox id={`sup-${s.id}`} className="mt-0.5" />
              <label
                htmlFor={`sup-${s.id}`}
                className="text-sm leading-snug cursor-pointer"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  — {s.dose}, {s.time}
                </span>
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Objetivo de agua: 2-2.5 litros/dia. Priorizar hidratacion por la
            manana y post-entreno. Si experimentas sintomas digestivos severos,
            consulta a un profesional de salud.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
