"use client";

import { IconButton } from "./IconButton";

const INTERESTS = [
  { id: "sports", icon: "⚽", label: "Deporte" },
  { id: "games", icon: "🎮", label: "Videojuegos" },
  { id: "reading", icon: "📚", label: "Lectura" },
  { id: "food", icon: "🍲", label: "Cocina" },
  { id: "music", icon: "🎵", label: "Música" },
  { id: "nature", icon: "🌿", label: "Naturaleza" },
  { id: "creativity", icon: "💡", label: "Creatividad" },
  { id: "tech", icon: "🤖", label: "Tecnología" },
  { id: "art", icon: "🎨", label: "Arte" }
];

type InterestGridProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
};

export function InterestGrid({
  selected,
  onChange,
  max = 2
}: InterestGridProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      if (selected.length >= max) return;
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 text-center">
        Elige hasta <strong>{max}</strong> superpoderes para tu familia.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {INTERESTS.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            selected={selected.includes(item.id)}
            onClick={() => toggle(item.id)}
          />
        ))}
      </div>
      {selected.length >= max && (
        <p className="text-[11px] text-center text-amber-700 mt-1">
          Ya elegiste el máximo permitido.
        </p>
      )}
    </div>
  );
}
