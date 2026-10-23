import { redirect } from "next/navigation";

import { API_PREFIX } from "./api";
import { DjangoError, djangoFetch } from "./django";
import { isAccessTokenExpired } from "./jwt";
import { readTokens } from "./session";

/**
 * Lecture du referentiel sportif (phase 2), cote serveur uniquement.
 * Le token JWT est lu dans le cookie httpOnly : il ne traverse jamais le navigateur.
 */

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Sport = {
  id: string;
  name: string;
  slug: string;
  sport_type: "TEAM" | "INDIVIDUAL";
  is_active: boolean;
  position: number;
};

export type Country = { id: string; name: string; code: string };

export type Season = {
  id: string;
  label: string;
  year_start: number;
  year_end: number;
  is_current: boolean;
};

export type Competition = {
  id: string;
  name: string;
  slug: string;
  tier: number;
  sport: string; // slug du sport
  country: Country | null;
  current_season: Season | null;
};

export type CompetitionDetail = Competition & { seasons: Season[] };

export type Venue = {
  id: string;
  name: string;
  city: string;
  capacity: number | null;
};

export type Team = {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  sport: string; // slug du sport
  country: Country | null;
  logo_url: string;
  stadium: string; // "" si inconnu
  league: string; // championnat de la saison en cours, "" si aucun
};

export type TeamParticipation = {
  competition: { id: string; name: string; slug: string };
  season: Season;
  stats: Record<string, unknown>;
};

export type TeamDetail = Team & {
  founded_year: number | null;
  venue: Venue | null;
  participations: TeamParticipation[];
};

type Query = Record<string, string | undefined>;

async function authedGet<T>(path: string, query: Query = {}): Promise<T> {
  const { access } = await readTokens();
  if (!access || isAccessTokenExpired(access)) redirect("/auth/login");

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.size ? `?${params.toString()}` : "";

  try {
    const { data } = await djangoFetch(`${API_PREFIX}${path}${qs}`, {
      headers: { Authorization: `Bearer ${access}` },
    });
    return data as T;
  } catch (error) {
    if (error instanceof DjangoError && error.status === 401) {
      redirect("/auth/login");
    }
    throw error;
  }
}

/** Suit la pagination DRF (PAGE_SIZE 25) jusqu'a la derniere page. */
async function fetchAll<T>(path: string, query: Query = {}): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= 20; page += 1) {
    const data = await authedGet<Paginated<T>>(path, {
      ...query,
      page: String(page),
    });
    items.push(...data.results);
    if (!data.next) break;
  }

  return items;
}

export const getSports = () => fetchAll<Sport>("/sports/");

export const getCountries = () => fetchAll<Country>("/countries/");

export const getCompetitions = (filters: { sport?: string; country?: string } = {}) =>
  fetchAll<Competition>("/competitions/", filters);

export const getCompetition = (id: string) =>
  authedGet<CompetitionDetail>(`/competitions/${id}/`);

export const getTeams = (
  filters: { competition?: string; country?: string; search?: string } = {}
) => fetchAll<Team>("/teams/", filters);

/** Une page de resultats (25 equipes) + le total, pour la pagination. */
export const getTeamsPage = (
  filters: { competition?: string; search?: string; page?: number }
) =>
  authedGet<Paginated<Team>>("/teams/", {
    competition: filters.competition,
    search: filters.search,
    page: filters.page && filters.page > 1 ? String(filters.page) : undefined,
  });

export const getTeam = (id: string) => authedGet<TeamDetail>(`/teams/${id}/`);

// --- Matchs (phase 4) ------------------------------------------------------

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "SUSPENDED";

export type MatchTeam = {
  id: string;
  name: string;
  short_name: string;
  logo_url: string;
};

export type Match = {
  id: string;
  kickoff_at: string; // ISO 8601, toujours en UTC ("...Z")
  status: MatchStatus;
  score_home: number | null;
  score_away: number | null;
  competition: { id: string; name: string; slug: string };
  season: string;
  round: number | null;
  home_team: MatchTeam;
  away_team: MatchTeam;
  venue: string;
};

export type MatchEventType =
  | "GOAL"
  | "OWN_GOAL"
  | "PENALTY"
  | "YELLOW_CARD"
  | "RED_CARD"
  | "SUBSTITUTION"
  | "VAR";

export type MatchEvent = {
  id: string;
  minute: number;
  extra_minute: number | null;
  type: MatchEventType;
  team_id: string | null;
  player_name: string;
};

export type MatchDetail = Omit<Match, "venue"> & {
  venue: Venue | null;
  referee: string;
  weather: Record<string, unknown>;
  events: MatchEvent[];
};

export type MatchFilters = {
  date?: string; // AAAA-MM-JJ, jour calendaire dans le fuseau tz
  tz?: string; // fuseau IANA, ex. Africa/Douala
  competition?: string;
  status?: string; // ex. "LIVE" ou "FINISHED,LIVE"
  page?: number;
};

export const getMatchesPage = (filters: MatchFilters = {}) =>
  authedGet<Paginated<Match>>("/matches/", {
    date: filters.date,
    tz: filters.tz,
    competition: filters.competition,
    status: filters.status,
    page: filters.page && filters.page > 1 ? String(filters.page) : undefined,
  });

export const getMatch = (id: string) => authedGet<MatchDetail>(`/matches/${id}/`);
