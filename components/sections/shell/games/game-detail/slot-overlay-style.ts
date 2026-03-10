type FieldSlotPosition = {
  x: number;
  y: number;
};

export function getFieldSlotOverlayStyle(slot: FieldSlotPosition) {
  const horizontalAlign =
    slot.x <= 34 ? "start" : slot.x >= 66 ? "end" : "center";
  const verticalAlign = slot.y >= 74 ? "above" : "center";

  return {
    left:
      horizontalAlign === "start"
        ? `calc(${slot.x}% + 10px)`
        : horizontalAlign === "end"
          ? `calc(${slot.x}% - 10px)`
          : `${slot.x}%`,
    top:
      verticalAlign === "above"
        ? `calc(${slot.y}% - 12px)`
        : `calc(${slot.y}% + 12px)`,
    transform: `translate(${
      horizontalAlign === "start"
        ? "0"
        : horizontalAlign === "end"
          ? "-100%"
          : "-50%"
    }, ${verticalAlign === "above" ? "-100%" : "0"})`,
  } as const;
}
