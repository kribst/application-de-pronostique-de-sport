/**
 * Dates et fuseaux. L'API renvoie des instants UTC ("...Z") ; l'affichage se fait
 * toujours dans le fuseau de l'utilisateur, passe explicitement (jamais celui
 * du serveur ou du navigateur) pour que le rendu serveur et client soient identiques.
 */

export function safeTimezone(tz: string | undefined | null): string {
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

const isoDay = (tz: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Jour calendaire (AAAA-MM-JJ) d'un instant dans un fuseau. */
export function localDate(instant: Date | string, tz: string): string {
  return isoDay(tz).format(new Date(instant));
}

export function todayIn(tz: string): string {
  return localDate(new Date(), tz);
}

export function isIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatTime(instant: string, tz: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

export function formatDateTime(instant: string, tz: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(instant));
}

/** Libelle d'un jour calendaire (sans conversion de fuseau). */
export function formatDay(
  date: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("fr-FR", { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`)
  );
}

/** "dans 2 j 3 h", "dans 2 h 15", "dans 12 min" ; chaine vide si l'instant est passe. */
export function formatCountdown(instant: string, now: Date = new Date()): string {
  const minutes = Math.floor((new Date(instant).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "";
  if (minutes < 60) return `dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `dans ${hours} h ${String(minutes % 60).padStart(2, "0")}`;
  return `dans ${Math.floor(hours / 24)} j ${hours % 24} h`;
}
