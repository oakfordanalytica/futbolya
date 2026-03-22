export type Gender = "male" | "female" | "mixed";
export type DivisionType = "alphabetic" | "greek" | "numeric";

export type AgeCategory = {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
};

export type Position = {
  id: string;
  name: string;
  abbreviation: string;
};

export type LineupTemplate = {
  id: string;
  name: string;
  slots: {
    id: string;
    x: number;
    y: number;
    role: "goalkeeper" | "outfield";
  }[];
};

export type HorizontalDivisions = {
  enabled: boolean;
  type: DivisionType;
};
