export interface FootballLineupPlayer {
  id: string | number;
  name: string;
  number: string | number;
  position?: string;
  photoUrl?: string;
  lastName?: string;
}

export interface FootballLineupTemplateSlot {
  id: string;
  x: number;
  y: number;
  role: "goalkeeper" | "outfield";
}

export interface FootballLineupSlot extends FootballLineupTemplateSlot {
  player?: FootballLineupPlayer;
}

export interface FootballLineup {
  teamName: string;
  teamColor?: string;
  formation?: string;
  starters: FootballLineupPlayer[];
  substitutes?: FootballLineupPlayer[];
  slots?: FootballLineupSlot[];
}
