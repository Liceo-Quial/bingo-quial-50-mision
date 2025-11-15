"use client";

import { useReducer, useState } from "react";
import { Stepper } from "@/components/Stepper";
import {
  AvatarGrid,
  type FamilyMember,
  type FamilyRole
} from "@/components/AvatarGrid";
import { InterestGrid } from "@/components/InterestGrid";
import { AreaSelector } from "@/components/AreaSelector";

type State = {
  step: number;
  familySize: number | null;
  members: FamilyMember[];
  area: string | null;
  interests: string[];
  teamName: string;
  submitting: boolean;
  submitted: boolean;
  error?: string;
};

type Action =
  | { type: "SET_FAMILY_SIZE"; payload: number }
  | { type: "ADD_MEMBER"; payload: FamilyRole }
  | { type: "REMOVE_MEMBER"; payload: string }
  | { type: "SET_AREA"; payload: string }
  | { type: "SET_INTERESTS"; payload: string[] }
  | { type: "SET_TEAM_NAME"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR"; payload: string };

const TOTAL_STEPS = 7;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FAMILY_SIZE":
      return { ...state, familySize: action.payload, members: [] };
    case "ADD_MEMBER":
      return {
        ...state,
        members: [
          ...state.members,
          { id: crypto.randomUUID(), role: action.payload }
        ]
      };
    case "REMOVE_MEMBER":
      return {
        ...state,
        members: state.members.filter((m) => m.id !== action.payload)
      };
    case "SET_AREA":
      return { ...state, area: action.payload };
    case "SET_INTERESTS":
      return { ...state, interests: action.payload };
    case "SET_TEAM_NAME":
      return { ...state, teamName: action.payload };
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS) };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "SUBMIT_START":
      return { ...state, submitting: true, error: undefined };
    case "SUBMIT_SUCCESS":
      return { ...state, submitting: false, submitted: true };
    case "SUBMIT_ERROR":
      return { ...state, submitting: false, error: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  step: 1,
  familySize: null,
  members: [],
  area: null,
  interests: [],
  teamName: "",
  submitting: false,
  submitted: false
};

export default function Bingo50Page() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [clientError, setClientError] = useState<string | null>(null);

  const canGoNext = () => {
    switch (state.step) {
      case 1:
        return true;
      case 2:
        return state.familySize !== null;
      case 3:
        return state.familySize !== null && state.members.length === state.familySize;
      case 4:
        return !!state.area;
      case 5:
        return state.interests.length > 0;
      case 6:
        return state.teamName.trim().length > 0;
      case 7:
        return !state.submitting;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setClientError(null);
    dispatch({ type: "SUBMIT_START" });

    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familySize: state.familySize,
          members: state.members,
          area: state.area,
          interests: state.interests,
          teamName: state.teamName
        })
      });

      if (!res.ok) {
        throw new Error("Error al guardar la información");
      }

      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err: any) {
      dispatch({
        type: "SUBMIT_ERROR",
        payload: err?.message ?? "Error desconocido"
      });
      setClientError("No pudimos guardar los datos. Intenta de nuevo.");
    }
  };

  const next = async () => {
    if (!canGoNext()) return;
    if (state.step === TOTAL_STEPS) {
      await handleSubmit();
    } else {
      dispatch({ type: "NEXT_STEP" });
    }
  };

  const prev = () => {
    if (state.step === 1 || state.submitting) return;
    dispatch({ type: "PREV_STEP" });
  };

  return (
    <div className="w-full max-w-md bg-white/90 rounded-3xl shadow-xl border border-amber-100 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">
          🎂
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">
            Bingo Quial · 50 años
          </h1>
          <p className="text-xs text-slate-500">
            Activa tu tarjeta familiar en menos de 1 minuto.
          </p>
        </div>
      </div>

      <Stepper current={state.step} total={TOTAL_STEPS} />

      {!state.submitted ? (
        <>
          <div className="mt-4 mb-5">
            {state.step === 1 && <Step1 />}
            {state.step === 2 && (
              <Step2
                familySize={state.familySize}
                onSelect={(n) =>
                  dispatch({ type: "SET_FAMILY_SIZE", payload: n })
                }
              />
            )}
            {state.step === 3 && state.familySize !== null && (
              <Step3
                total={state.familySize}
                members={state.members}
                onAdd={(role) => dispatch({ type: "ADD_MEMBER", payload: role })}
                onRemove={(id) =>
                  dispatch({ type: "REMOVE_MEMBER", payload: id })
                }
              />
            )}
            {state.step === 4 && (
              <Step4
                area={state.area ?? undefined}
                onChange={(id) =>
                  dispatch({ type: "SET_AREA", payload: id })
                }
              />
            )}
            {state.step === 5 && (
              <Step5
                interests={state.interests}
                onChange={(next) =>
                  dispatch({ type: "SET_INTERESTS", payload: next })
                }
              />
            )}
            {state.step === 6 && (
              <Step6
                teamName={state.teamName}
                onChange={(value) =>
                  dispatch({ type: "SET_TEAM_NAME", payload: value })
                }
              />
            )}
            {state.step === 7 && <Step7 />}
          </div>

          {clientError && (
            <p className="text-xs text-red-600 mb-2 text-center">
              {clientError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={state.step === 1 || state.submitting}
              className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
            >
              ← Atrás
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canGoNext()}
              className="ml-auto inline-flex items-center justify-center rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-5 py-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {state.step === TOTAL_STEPS
                ? state.submitting
                  ? "Guardando..."
                  : "Finalizar"
                : "Continuar →"}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-6 text-center space-y-3">
          <div className="text-4xl">🎉</div>
          <h2 className="text-lg font-semibold">¡Tarjeta activada!</h2>
          <p className="text-sm text-slate-600">
            Tu familia ya hace parte de la historia de los 50 años del Liceo
            Quial. Busca los QR de misiones en el Bingo y sigue sumando puntos.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------- STEPS UI ----------

function Step1() {
  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-slate-700">
        Este año celebramos <strong>50 años</strong> del Liceo Quial. Vamos a
        armar la tarjeta de tu familia para el Bingo.
      </p>
      <p className="text-xs text-slate-500">
        Es un juego rápido: no pedimos datos raros, solo quiénes vienen y qué
        les gusta.
      </p>
    </div>
  );
}

type Step2Props = {
  familySize: number | null;
  onSelect: (n: number) => void;
};

function Step2({ familySize, onSelect }: Step2Props) {
  const options = [1, 2, 3, 4, 5, 6];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 text-center">
        ¿Cuántas personas vienen con tu familia hoy?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            className={`flex flex-col items-center justify-center rounded-2xl border px-3 py-3 text-sm shadow-sm ${
              familySize === n
                ? "bg-amber-100 border-amber-400 text-amber-900"
                : "bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            <span className="text-2xl mb-1">
              {n <= 4 ? "👨‍👩‍👧‍👦" : "👨‍👩‍👧‍👧"}
            </span>
            <span>{n}</span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-center text-slate-500">
        Si son más de 6, elige 6 y cuenta a los demás igual en tu equipo.
      </p>
    </div>
  );
}

type Step3Props = {
  total: number;
  members: FamilyMember[];
  onAdd: (role: FamilyRole) => void;
  onRemove: (id: string) => void;
};

function Step3({ total, members, onAdd, onRemove }: Step3Props) {
  return (
    <AvatarGrid
      totalNeeded={total}
      members={members}
      onAdd={onAdd}
      onRemove={onRemove}
    />
  );
}

type Step4Props = {
  area?: string;
  onChange: (id: string) => void;
};

function Step4({ area, onChange }: Step4Props) {
  return <AreaSelector selected={area} onChange={onChange} />;
}

type Step5Props = {
  interests: string[];
  onChange: (next: string[]) => void;
};

function Step5({ interests, onChange }: Step5Props) {
  return <InterestGrid selected={interests} onChange={onChange} max={2} />;
}

type Step6Props = {
  teamName: string;
  onChange: (value: string) => void;
};

function Step6({ teamName, onChange }: Step6Props) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-700 text-center">
        Ponle nombre a tu equipo familiar.
      </p>
      <input
        type="text"
        value={teamName}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ej: Los Súper Quial, Familia Rojas..."
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <p className="text-[11px] text-slate-500 text-center">
        Este nombre solo se usa dentro del evento para las misiones y rifas.
      </p>
    </div>
  );
}

function Step7() {
  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-slate-700">
        Listo. Vamos a guardar la información de tu equipo en la tarjeta del
        Bingo Quial.
      </p>
      <p className="text-xs text-slate-500">
        No compartimos tus datos fuera del colegio. Solo se usarán para mejorar
        el evento y las actividades familiares.
      </p>
    </div>
  );
}
