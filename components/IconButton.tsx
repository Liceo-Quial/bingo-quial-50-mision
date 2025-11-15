"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  selected?: boolean;
  onClick?: () => void;
};

export function IconButton({ icon, label, selected, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border px-3 py-3 text-sm shadow-sm transition active:scale-95",
        "min-w-[76px] min-h-[76px]",
        selected
          ? "bg-amber-100 border-amber-400 text-amber-900"
          : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50"
      )}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <span className="text-xs text-center leading-tight">{label}</span>
    </button>
  );
}
