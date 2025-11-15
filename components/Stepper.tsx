"use client";

type StepperProps = {
  current: number;
  total: number;
};

export function Stepper({ current, total }: StepperProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
        <span>
          Paso {current} de {total}
        </span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
