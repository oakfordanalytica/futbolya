import type { League, Match, PinnedLeague } from "./types";

export const matches: Match[] = [
  {
    id: 1,

    status: "FT",

    league: "world-cup-u17",

    competition: "FIFA Under-17 World Cup",

    kickoff: "2024-06-10T18:00:00.000Z",

    team1: "South Korea U17",

    team1Flag: "🇰🇷",

    team1Record: "(2-1-0)",

    team2: "Ivory Coast U17",

    team2Flag: "🇨🇮",

    team2Record: "(0-0-3)",

    score1: 3,

    score2: 1,

    venue: "Aspire Zone Pitch 8",

    city: "Ar-Rayyan",

    country: "Qatar",

    events1: [
      { type: "goal", name: "J Kim", minute: "26'" },

      { type: "goal", name: "H Jeong", minute: "48'" },

      { type: "goal", name: "Y Yi", minute: "87' Pen" },
    ],

    events2: [{ type: "goal", name: "A Toure", minute: "35'" }],
  },

  {
    id: 2,
    status: "FT",

    league: "world-cup-u17",

    competition: "FIFA Under-17 World Cup",

    kickoff: "2024-06-10T20:00:00.000Z",

    team1: "Switzerland U17",

    team1Flag: "🇨🇭",

    team1Record: "(2-1-0)",

    team2: "Mexico U17",

    team2Flag: "🇲🇽",

    team2Record: "(1-0-2)",

    score1: 3,

    score2: 1,

    venue: "Aspire Zone Pitch 3",

    city: "Ar-Rayyan",

    country: "Qatar",

    events1: [
      { type: "goal", name: "M Mijailovic", minute: "17'" },

      { type: "goal", name: "F Contreras", minute: "20' OG" },

      { type: "goal", name: "S. Iglesias", minute: "43'" },
    ],

    events2: [{ type: "goal", name: "A De Nigris", minute: "57'" }],
  },

  {
    id: 3,
    status: "Live",

    league: "world-cup-u17",

    competition: "FIFA Under-17 World Cup",

    kickoff: "2024-06-11T14:00:00.000Z",

    team1: "Colombia U17",

    team1Flag: "🇨🇴",

    team1Record: "(1-2-0)",

    team2: "North Korea U17",

    team2Flag: "🇰🇵",

    team2Record: "(1-1-1)",

    score1: 2,

    score2: 0,

    venue: "Aspire Complex",

    city: "Ar-Rayyan",

    country: "Qatar",

    events1: [
      { type: "goal", name: "M Solarte", minute: "25'" },

      { type: "goal", name: "S Londoño", minute: "33' Pen" },
    ],

    events2: [],
  },

  {
    id: 4,
    status: "FT",

    league: "la-liga",

    competition: "La Liga",

    kickoff: "2024-05-02T19:30:00.000Z",

    team1: "Celta Vigo",

    team1Flag: "🇪🇸",

    team1Record: "(0-1-2)",

    team2: "Barcelona",

    team2Flag: "🇪🇸",

    team2Record: "(1-2-0)",

    score1: 2,

    score2: 5,

    venue: "Balaídos",

    city: "Vigo",

    country: "Spain",

    events1: [
      { type: "goal", name: "S Carreira", minute: "11'" },

      { type: "goal", name: "B Iglesias", minute: "43'" },
    ],

    events2: [
      { type: "goal", name: "R Lewandowski", minute: "10' Pen" },

      { type: "goal", name: "R Lewandowski", minute: "37'" },

      { type: "goal", name: "R Lewandowski", minute: "73'" },

      { type: "goal", name: "L Yamal", minute: "45+4'" },

      { type: "red_card", name: "F de Jong", minute: "90+4'" },
    ],
  },
];

export const leagues: League[] = [
  {
    id: 1,

    value: "premier-league",

    label: "Premier League",

    country: "England",
  },

  {
    id: 2,

    value: "la-liga",

    label: "La Liga",

    country: "Spain",
  },

  {
    id: 3,

    value: "bundesliga",

    label: "Bundesliga",

    country: "Germany",
  },

  {
    id: 4,

    value: "serie-a",

    label: "Serie A",

    country: "Italy",
  },

  {
    id: 5,

    value: "ligue-1",

    label: "Ligue 1",

    country: "France",
  },

  {
    id: 6,
    value: "world-cup-u17",
    label: "World Cup U17",
    country: "International",
  },
];

export const pinnedLeagues: PinnedLeague[] = [
  {
    id: 1,
    name: "Premier League",
    flag: "🏴󐁧󐁢󐁥󐁮󐁧󐁿",
  },
  {
    id: 2,
    name: "Ligue 1",
    flag: "🇫🇷",
  },
  {
    id: 3,
    name: "Bundesliga",
    flag: "🇩🇪",
  },
  {
    id: 4,
    name: "Serie A",
    flag: "🇮🇹",
  },
  {
    id: 5,
    name: "Eredivisie",
    flag: "🇳🇱",
  },
  {
    id: 6,
    name: "LaLiga",
    flag: "🇪🇸",
  },
  {
    id: 7,
    name: "Euro",
    flag: "🇪🇺",
  },
  {
    id: 8,
    name: "Champions League",
    flag: "🇪🇺",
  },
  {
    id: 9,
    name: "Europa League",
    flag: "🇪🇺",
  },
  {
    id: 10,
    name: "Conference League",
    flag: "🇪🇺",
  },
  {
    id: 11,
    name: "UEFA Nations Lea...",
    flag: "🇪🇺",
  },
  {
    id: 12,
    name: "Copa Libertadores",
    flag: "🇧🇷",
  },
  {
    id: 13,
    name: "World Cup",
    flag: "🌍",
  },
  {
    id: 14,
    name: "World Cup U17",
    flag: "🌍",
  },
];
