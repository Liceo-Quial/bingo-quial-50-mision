"use client";

import { IconButton } from "./IconButton";

const AREAS = [
  { id: "castillo", icon: "🏰", label: "El Castillo" },
  { id: "alfaguara", icon: "🏘️", label: "Alfaguara" },
  { id: "morada", icon: "🌳", label: "La Morada" },
  { id: "jamundi", icon: "📍", label: "Jamundí" },
  { id: "cali", icon: "🏙️", label: "Cali" },
  { id: "otro", icon: "🗺️", label: "Otro" }
];

type AreaSelectorProps = {
  selected?: string;
  onChange: (id: string) => void;
};

export function AreaSelector({ selected, onChange }: AreaSelectorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 text-center">
        ¿Desde qué zona viene tu familia hoy?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {AREAS.map((item) => (
          <IconButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            selected={selected === item.id}
            onClick={() => onChange(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
