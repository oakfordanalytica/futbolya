export type EventType = "goal" | "yellow_card" | "red_card";

export interface MatchEvent {
  type: EventType;
  name: string;
  minute?: string;
  detail?: string;
}

export interface League {
  id: number;
  value: string;
  label: string;
  country: string;
  logoUrl?: string;
}

export interface PinnedLeague {
  id: number;
  name: string;
  flag: string;
}

export type MatchStatus = "Scheduled" | "Live" | "Postponed" | "FT" | string;

export interface Match {
  id: number;
  status: MatchStatus;
  league: League["value"];
  competition: string;
  kickoff: string;
  team1: string;
  team1Flag: string;
  team1Record?: string;
  team2: string;
  team2Flag: string;
  team2Record?: string;
  score1: number;
  score2: number;
  venue?: string;
  city?: string;
  country?: string;
  events1?: MatchEvent[];
  events2?: MatchEvent[];
}
