// « Jour » du quota et de la dépense IA : de minuit à minuit, heure de Paris (architecture.md, RG1).
// Calcul par Intl (fuseau Europe/Paris), donc juste aux changements d'heure (journées de 23 h et de 25 h).

const TIME_ZONE = "Europe/Paris";

const partsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type ParisParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function parisParts(instant: Date): ParisParts {
  const parts = Object.fromEntries(partsFormatter.formatToParts(instant).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Jour à Paris au format AAAA-MM-JJ (clé de quota). */
export function parisDay(instant: Date = new Date()): string {
  const { year, month, day } = parisParts(instant);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Décalage de Paris par rapport à UTC à cet instant, en millisecondes (+1 h en hiver, +2 h en été). */
function parisOffsetMs(instant: Date): number {
  const { year, month, day, hour, minute, second } = parisParts(instant);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Instant UTC correspondant à minuit, heure de Paris, du jour civil donné. */
function parisMidnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  // Deux passes : le décalage à appliquer est celui de l'instant visé, pas celui de la veille.
  const first = guess - parisOffsetMs(new Date(guess));
  return new Date(guess - parisOffsetMs(new Date(first)));
}

/** Prochain minuit à Paris (remise à zéro des quotas, `resetAt`). */
export function nextParisMidnight(instant: Date = new Date()): Date {
  const { year, month, day } = parisParts(instant);
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1));
  return parisMidnight(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate());
}

const PARIS_DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Date et heure à Paris pour l'affichage (« 17 octobre 2026 à 14:32 »), quel que soit le fuseau du serveur. */
export function formatParisDateTime(instant: Date): string {
  return PARIS_DATE_TIME.format(instant);
}

const PARIS_DATE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", year: "numeric" });

/** Date à Paris pour l'affichage (« 17 octobre 2026 »). */
export function formatParisDate(instant: Date): string {
  return PARIS_DATE.format(instant);
}
