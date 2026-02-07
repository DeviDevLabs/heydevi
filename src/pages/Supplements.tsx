import { supplements } from "@/data/supplements";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Supplements = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold font-serif">Suplementos</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Horarios optimizados para entreno a las 6:00 y sueno a las 22:00
      </p>
    </div>

    <div className="space-y-3">
      {supplements.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <h3 className="font-semibold text-sm">{s.name}</h3>
                <p className="text-sm text-muted-foreground">{s.dose}</p>
                {s.notes && (
                  <p className="text-xs text-accent italic">{s.notes}</p>
                )}
              </div>
              <div className="text-right space-y-1 shrink-0">
                <Badge variant="secondary">{s.time}</Badge>
                <p className="text-xs text-muted-foreground">{s.schedule}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    <Card className="border-accent/20 bg-accent/5">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Estos horarios estan optimizados para entrenamiento a las 6:00 AM y
          hora de dormir objetivo a las 22:00. La creatina se toma
          post-entreno, el magnesio antes de dormir para favorecer el descanso
          y el transito intestinal. Si experimentas efectos adversos con algun
          suplemento, pausalo y consulta a un profesional de salud.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default Supplements;
