"use client";

import { IconButton } from "./IconButton";

export type FamilyRole =
  | "girl"
  | "boy"
  | "mom"
  | "dad"
  | "grandparent"
  | "teacher"
  | "teen";

export type FamilyMember = {
  id: string;
  role: FamilyRole;
};

const ROLE_CONFIG: { role: FamilyRole; icon: string; label: string }[] = [
  { role: "girl", icon: "👧", label: "Niña" },
  { role: "boy", icon: "👦", label: "Niño" },
  { role: "teen", icon: "🎓", label: "Estudiante mayor" },
  { role: "mom", icon: "👩", label: "Mamá" },
  { role: "dad", icon: "👨", label: "Papá" },
  { role: "grandparent", icon: "🧓", label: "Abuelo/a" },
  { role: "teacher", icon: "👩‍🏫", label: "Docente" }
];

type AvatarGridProps = {
  totalNeeded: number;
  members: FamilyMember[];
  onAdd: (role: FamilyRole) => void;
  onRemove: (id: string) => void;
};

export function AvatarGrid({
  totalNeeded,
  members,
  onAdd,
  onRemove
}: AvatarGridProps) {
  const remaining = totalNeeded - members.length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-700 text-center">
        Arriba verás tu “equipo familiar”. Agrega personas hasta completar{" "}
        <strong>{totalNeeded}</strong>.
      </p>

      <div className="flex flex-wrap gap-2 justify-center rounded-2xl bg-white/70 p-3 border border-amber-100 min-h-[52px]">
        {members.map((m) => {
          const config = ROLE_CONFIG.find((r) => r.role === m.role)!;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onRemove(m.id)}
              className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs"
              title="Tocar para quitar"
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
              <span className="text-[10px] text-amber-700">×</span>
            </button>
          );
        })}
        {members.length === 0 && (
          <span className="text-xs text-slate-400">
            Aún no agregas a nadie…
          </span>
        )}
      </div>

      <p className="text-xs text-center text-slate-500">
        Te faltan <strong>{Math.max(remaining, 0)}</strong> personas por agregar.
      </p>

      <div className="grid grid-cols-3 gap-3">
        {ROLE_CONFIG.map((cfg) => (
          <IconButton
            key={cfg.role}
            icon={cfg.icon}
            label={cfg.label}
            onClick={() =>
              members.length < totalNeeded ? onAdd(cfg.role) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
