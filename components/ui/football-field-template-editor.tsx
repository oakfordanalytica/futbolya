"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { UserRound } from "lucide-react";
import { FootballFieldSurface } from "@/components/ui/football-field-surface";
import type { FootballLineupTemplateSlot } from "@/components/ui/football-field.types";
import { cn } from "@/lib/utils";

interface FootballFieldTemplateEditorProps {
  slots: FootballLineupTemplateSlot[];
  onChange: (slots: FootballLineupTemplateSlot[]) => void;
  className?: string;
}

const MIN_X = 8;
const MAX_X = 92;
const MIN_Y = 8;
const MAX_Y = 92;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DraggableSlot({ slot }: { slot: FootballLineupTemplateSlot }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: slot.id,
    });

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        zIndex: isDragging ? 40 : 20,
      }}
    >
      <div
        ref={setNodeRef}
        className="relative touch-none cursor-grab active:cursor-grabbing"
        style={{
          transform: CSS.Translate.toString(transform),
        }}
        {...listeners}
        {...attributes}
      >
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white shadow-md backdrop-blur-sm",
            slot.role === "goalkeeper" && "bg-yellow-500/70 text-black",
          )}
        >
          <UserRound className="size-5 opacity-80" />
        </div>
      </div>
    </div>
  );
}

export function FootballFieldTemplateEditor({
  slots,
  onChange,
  className,
}: FootballFieldTemplateEditorProps) {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const field = fieldRef.current;
    if (!field) {
      return;
    }

    const rect = field.getBoundingClientRect();
    const slot = slots.find((item) => item.id === active.id);
    if (!slot || rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const nextX = clamp(slot.x + (delta.x / rect.width) * 100, MIN_X, MAX_X);
    const nextY = clamp(slot.y + (delta.y / rect.height) * 100, MIN_Y, MAX_Y);

    onChange(
      slots.map((item) =>
        item.id === slot.id ? { ...item, x: nextX, y: nextY } : item,
      ),
    );
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <FootballFieldSurface className={className}>
        <div ref={fieldRef} className="absolute inset-0 z-20">
          {slots.map((slot) => (
            <DraggableSlot key={slot.id} slot={slot} />
          ))}
        </div>
      </FootballFieldSurface>
    </DndContext>
  );
}
