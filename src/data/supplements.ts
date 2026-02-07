import { Supplement } from "@/types/nutrition";

export const supplements: Supplement[] = [
  {
    id: "creatina",
    name: "Creatina monohidrato",
    dose: "5 g",
    time: "7:00 — post-entreno",
    schedule: "Diario",
    notes: "Mezclar con agua o batido post-entreno",
  },
  {
    id: "d3k2",
    name: "Vitamina D3 + K2",
    dose: "2000 UI D3 + 100 mcg K2",
    time: "Con desayuno",
    schedule: "Diario",
  },
  {
    id: "b12",
    name: "B12 metilcobalamina",
    dose: "1000 mcg",
    time: "Por la manana",
    schedule: "Lunes, miercoles, viernes",
    notes: "Esencial en dieta vegetariana",
  },
  {
    id: "omega3",
    name: "Omega-3 de algas (DHA+EPA)",
    dose: "250-500 mg",
    time: "Con desayuno",
    schedule: "Diario",
  },
  {
    id: "vitc",
    name: "Vitamina C",
    dose: "250-500 mg",
    time: "Media manana o comida",
    schedule: "Diario",
    notes: "Evitar justo antes o despues del entreno",
  },
  {
    id: "magnesio",
    name: "Magnesio glicinato",
    dose: "200-400 mg (1-2 capsulas)",
    time: "21:00-21:30 — antes de dormir",
    schedule: "Diario",
    notes: "Ayuda a relajacion y transito intestinal. Pausar si causa molestias gastrointestinales.",
  },
];
