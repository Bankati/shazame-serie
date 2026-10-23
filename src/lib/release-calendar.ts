// Calendrier des sorties (U42) : dates TMDB « AAAA-MM-JJ » (jour civil, sans heure). Formatées en UTC pour
// qu'aucun fuseau ne décale le jour affiché.

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

function toUtcDate(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, date ?? 1));
}

/** « 18 décembre 2026 ». */
export function formatReleaseDay(day: string): string {
  return dayFormatter.format(toUtcDate(day));
}

/** « Décembre 2026 » (majuscule initiale, pour un intertitre). */
export function formatReleaseMonth(day: string): string {
  const label = monthFormatter.format(toUtcDate(day));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type MonthGroup<T> = { key: string; label: string | null; items: T[] };

/**
 * Regroupe par mois, dans l'ordre reçu (la liste est déjà triée par date). Les titres sans date forment un
 * dernier groupe sans intitulé.
 */
export function groupByMonth<T extends { releaseDate: string | null }>(items: readonly T[]): MonthGroup<T>[] {
  const groups = new Map<string, MonthGroup<T>>();
  for (const item of items) {
    const key = item.releaseDate ? item.releaseDate.slice(0, 7) : "undated";
    const group = groups.get(key) ?? {
      key,
      label: item.releaseDate ? formatReleaseMonth(item.releaseDate) : null,
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  const undated = groups.get("undated");
  groups.delete("undated");
  return undated ? [...groups.values(), undated] : [...groups.values()];
}
