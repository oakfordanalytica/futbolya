import type { FootballLineupTemplateSlot } from "@/components/ui/football-field.types";

export const FREE_FORM_FORMATION = "Free form";

export const LINEUP_FORMATION_OPTIONS = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "4-1-4-1",
  "4-3-2-1",
  "4-1-2-1-2",
  "3-4-3",
  "3-5-2",
  "3-2-4-1",
  "5-3-2",
  "5-4-1",
  "4-5-1",
  "4-4-1-1",
  "4-2-2-2",
  "4-2-4",
  "3-4-2-1",
  "3-4-1-2",
  "4-3-1-2",
  "5-2-3",
  "5-2-2-1",
  "4-2-1-3",
  "4-1-2-3",
  "3-1-4-2",
  "4-1-3-2",
  "4-1-2-2-1",
  "3-3-4",
  "3-3-3-1",
  "5-3-1-1",
  "3-3-2-2",
  "3-5-1-1",
  "2-3-2-3",
  FREE_FORM_FORMATION,
] as const;

export type LineupFormationOption = (typeof LINEUP_FORMATION_OPTIONS)[number];

function createFreeFormSlots(): FootballLineupTemplateSlot[] {
  return [
    { id: "slot-gk", x: 50, y: 84, role: "goalkeeper" },
    { id: "slot-def-1", x: 16, y: 67, role: "outfield" },
    { id: "slot-def-2", x: 38, y: 67, role: "outfield" },
    { id: "slot-def-3", x: 62, y: 67, role: "outfield" },
    { id: "slot-def-4", x: 84, y: 67, role: "outfield" },
    { id: "slot-mid-1", x: 26, y: 49, role: "outfield" },
    { id: "slot-mid-2", x: 50, y: 56, role: "outfield" },
    { id: "slot-mid-3", x: 74, y: 49, role: "outfield" },
    { id: "slot-att-1", x: 22, y: 18, role: "outfield" },
    { id: "slot-att-2", x: 50, y: 28, role: "outfield" },
    { id: "slot-att-3", x: 78, y: 18, role: "outfield" },
  ];
}

function parseFormationCounts(formation: string): number[] {
  return formation
    .split("-")
    .map((segment) => Number.parseInt(segment.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function createHorizontalPositions(count: number): number[] {
  if (count <= 1) {
    return [50];
  }

  const left = 16;
  const right = 84;
  const step = (right - left) / (count - 1);

  return Array.from({ length: count }, (_, index) => left + step * index);
}

function createVerticalPositions(lineCount: number): number[] {
  if (lineCount <= 1) {
    return [44];
  }

  const top = 18;
  const bottom = 67;
  const step = (bottom - top) / (lineCount - 1);

  return Array.from({ length: lineCount }, (_, index) => top + step * index);
}

export function isFormationPreset(
  value: string,
): value is LineupFormationOption {
  return LINEUP_FORMATION_OPTIONS.includes(value as LineupFormationOption);
}

export function createSlotsFromFormation(
  formation: string,
): FootballLineupTemplateSlot[] {
  if (formation === FREE_FORM_FORMATION) {
    return createFreeFormSlots();
  }

  const counts = parseFormationCounts(formation);
  if (counts.length === 0) {
    return createFreeFormSlots();
  }

  const slots: FootballLineupTemplateSlot[] = [
    {
      id: "slot-gk",
      x: 50,
      y: 84,
      role: "goalkeeper",
    },
  ];

  const verticalPositions = createVerticalPositions(counts.length);
  // Football formations are written from defense to attack, but the field is
  // rendered from bottom (goalkeeper) to top (forwards). Reverse the lines so
  // defenders stay closer to the goalkeeper and attackers appear higher.
  const placementCounts = [...counts].reverse();

  placementCounts.forEach((count, lineIndex) => {
    const y = verticalPositions[lineIndex];
    const horizontalPositions = createHorizontalPositions(count);
    horizontalPositions.forEach((x, slotIndex) => {
      slots.push({
        id: `slot-line-${lineIndex + 1}-${slotIndex + 1}`,
        x,
        y,
        role: "outfield",
      });
    });
  });

  return slots;
}
