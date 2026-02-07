import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { weeklyPlan } from "@/data/mealPlan";
import { getDayTotalProtein, getDayTotalCalories } from "@/lib/nutritionUtils";
import MealCard from "@/components/nutrition/MealCard";
import ProteinBar from "@/components/nutrition/ProteinBar";

const PROTEIN_TARGET = 100;

const WeeklyPlan = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-serif">Plan semanal</h1>
      <p className="text-muted-foreground text-sm mt-1">
        7 dias de alimentacion planificada — {PROTEIN_TARGET}g proteina/dia
      </p>
    </div>

    <Tabs defaultValue={weeklyPlan[0].dayName}>
      <TabsList className="w-full grid grid-cols-7">
        {weeklyPlan.map((day) => (
          <TabsTrigger
            key={day.dayName}
            value={day.dayName}
            className="text-xs px-1"
          >
            {day.dayName.slice(0, 3)}
          </TabsTrigger>
        ))}
      </TabsList>

      {weeklyPlan.map((day) => {
        const totalProtein = getDayTotalProtein(day);
        const totalCalories = getDayTotalCalories(day);
        return (
          <TabsContent
            key={day.dayName}
            value={day.dayName}
            className="space-y-4 mt-4"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{day.dayName}</span>
              <span className="text-muted-foreground">{totalCalories} kcal totales</span>
            </div>
            <ProteinBar current={totalProtein} target={PROTEIN_TARGET} />
            <div className="space-y-3">
              {day.meals.map((meal, i) => (
                <MealCard key={i} meal={meal} />
              ))}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  </div>
);

export default WeeklyPlan;
