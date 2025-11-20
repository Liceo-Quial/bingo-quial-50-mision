"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type MissionInfo = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  mission_type: string;
  points: number;
  qr_slug: string | null;
};

type EventInfo = {
  id: string;
  code: string;
  name: string;
};

type MissionPageData = {
  event: EventInfo;
  mission: MissionInfo;
};

export default function MissionPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const searchParams = useSearchParams();
  const locationCodeFromUrl = searchParams.get("loc") ?? undefined;

  const [data, setData] = useState<MissionPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/missions/${slug}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as MissionPageData;
        setData(json);
      } catch (err) {
        console.error("Error loading mission:", err);
        setErrorMsg("No pudimos cargar esta misión.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setErrorMsg("Por favor escribe el nombre de tu equipo.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/missions/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionSlug: slug,
          teamName,
          locationCode: locationCodeFromUrl,
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          const text = await res.text();
          if (text.includes("equipo")) {
            setErrorMsg("No encontramos ese equipo. Revisa el nombre.");
          } else {
            setErrorMsg("No encontramos esta misión.");
          }
        } else {
          setErrorMsg("Ocurrió un error al registrar la misión.");
        }
        return;
      }

      const json = await res.json();

      if (json.alreadyCompleted) {
        setSuccessMsg("Esta misión ya estaba registrada para tu equipo ✅");
      } else {
        setSuccessMsg(
          `¡Misión registrada! Sumaste ${json.points ?? 0} puntos para tu equipo. 🎉`
        );
      }
    } catch (err) {
      console.error("Error submit mission:", err);
      setErrorMsg("No pudimos registrar la misión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6">
          <p className="text-sm text-slate-600 text-center">
            Cargando misión…
          </p>
        </div>
      </div>
    );
  }

  if (!data || errorMsg && !successMsg) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700 text-center">
            {errorMsg ?? "No pudimos cargar esta misión."}
          </p>
        </div>
      </div>
    );
  }

  const { event, mission } = data;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      <div className="rounded-3xl border border-amber-200 bg-white/95 p-6 shadow-lg space-y-4">
        <header className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 border border-amber-100 text-[11px] text-amber-700">
            <span>🎯 Misión del Bingo</span>
            <span className="font-semibold">{event.name}</span>
          </div>
          <h1 className="text-lg font-semibold mt-2">{mission.name}</h1>
          {mission.description && (
            <p className="text-xs text-slate-600 mt-1">
              {mission.description}
            </p>
          )}
          <p className="text-[11px] text-slate-500 mt-1">
            Completa la misión con el nombre de tu equipo tal como lo registraste.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Nombre del equipo
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ej: Los Súper Quial, Familia Rojas..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Debe coincidir con el nombre que pusiste al registrar tu familia.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600 text-center">{errorMsg}</p>
          )}
          {successMsg && (
            <p className="text-xs text-emerald-700 text-center bg-emerald-50 border border-emerald-100 rounded-2xl px-3 py-2">
              {successMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Registrando misión…" : "Registrar misión"}
          </button>
        </form>

        <footer className="text-center">
          <p className="text-[10px] text-slate-400">
            Esta misión suma puntos a tu equipo para rifas y premios especiales
            del Bingo.
          </p>
        </footer>
      </div>
    </div>
  );
}
