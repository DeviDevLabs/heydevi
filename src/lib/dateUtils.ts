/**
 * Returns the local date string in YYYY-MM-DD format.
 * This avoids UTC offset issues where toISOString() might return
 * a different date than the user's local calendar day.
 */
export function getLocalDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns the local day name in Spanish.
 */
const DAYS_ES = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
export function getLocalDayName(date: Date = new Date()): string {
  return DAYS_ES[date.getDay()];
}

/**
 * Format a YYYY-MM-DD string to a readable Spanish date.
 */
export function formatDateES(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Get start and end dates (YYYY-MM-DD) for a given month.
 */
export function getMonthRange(date: Date = new Date()): { start: string; end: string } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0); // last day of month
  return {
    start: getLocalDateStr(start),
    end: getLocalDateStr(end),
  };
}
