"use client";

import { useEffect, useState } from "react";

type EventInfo = {
  id: string;
  code: string;
  name: string;
  event_date: string | null;
  location: string | null;
};

type MissionAdmin = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  mission_type: string;
  points: number;
  qr_slug: string | null;
  is_active: boolean;
  url: string | null; // generado en el API
};

type AdminResponse = {
  event: EventInfo;
  missions: MissionAdmin[];
};

export default function AdminMisionesPage() {
  const [data, setData] = useState<AdminResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch("/api/admin/missions", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as AdminResponse;
        setData(json);
      } catch (err) {
        console.error("Error loading admin missions:", err);
        setErrorMsg("No se pudieron cargar las misiones.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleCopy = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("URL copiada al portapapeles.");
      setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage("No se pudo copiar la URL.");
      setTimeout(() => setCopyMessage(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Administración de misiones</h1>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6">
          <p className="text-sm text-slate-600">Cargando misiones…</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Administración de misiones</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {errorMsg ?? "Error desconocido al cargar misiones."}
          </p>
        </div>
      </div>
    );
  }

  const { event, missions } = data;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Administración de misiones y QR</h1>
          <p className="text-xs text-slate-500">
            Evento: <span className="font-medium">{event.name}</span> · Código{" "}
            {event.code}{" "}
            {event.event_date ? `· Fecha: ${event.event_date}` : null}
          </p>
        </div>
        {copyMessage && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1">
            {copyMessage}
          </div>
        )}
      </header>

      {/* Tabla de misiones */}
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 overflow-x-auto">
        {missions.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay misiones configuradas para este evento.
          </p>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-2 text-left">Misión</th>
                <th className="py-2 text-left">Tipo</th>
                <th className="py-2 text-right">Puntos</th>
                <th className="py-2 text-left">Slug</th>
                <th className="py-2 text-left">URL</th>
                <th className="py-2 text-center">QR</th>
                <th className="py-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 align-top">
                  <td className="py-2 pr-2">
                    <div className="font-medium text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {m.code}
                      {m.description
                        ? ` · ${m.description.slice(0, 80)}${
                            m.description.length > 80 ? "…" : ""
                          }`
                        : ""}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-slate-600">
                    {formatMissionType(m.mission_type)}
                  </td>
                  <td className="py-2 pr-2 text-right">{m.points}</td>
                  <td className="py-2 pr-2 text-slate-600">
                    <span className="font-mono text-[11px]">
                      {m.qr_slug ?? "—"}
                    </span>
                  </td>
                  <td className="py-2 pr-2 max-w-xs">
                    {m.url ? (
                      <div className="flex flex-col gap-1">
                        <span className="block text-[11px] text-slate-600 break-all">
                          {m.url}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(m.url)}
                          className="self-start text-[10px] text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-50"
                        >
                          Copiar URL
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Sin slug configurado
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center align-top">
                    {m.url ? (
                      <div className="flex flex-col items-center gap-1">
                        {/* QR mini, clicable para abrir la misión */}
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir misión en nueva pestaña"
                          className="inline-block"
                        >
                          <img
                            src={`/api/qrcode?url=${encodeURIComponent(m.url)}`}
                            alt={`QR ${m.code}`}
                            className="inline-block w-16 h-16 rounded-md border border-slate-200 bg-white shadow-sm"
                          />
                        </a>

                        {/* Link para ver/imprimir QR grande (si usas /qrs/[slug]) */}
                        {m.qr_slug && (
                          <a
                            href={`/api/qrcode?type=svg&url=${encodeURIComponent(m.url)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-amber-700 underline"
                          >
                            Ver / imprimir grande
                          </a>
                        )}

                        {/* Descargas */}
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          <a
                            href={`/api/qrcode?type=png&url=${encodeURIComponent(m.url)}`}
                            download={`qr-${m.code}.png`}
                            className="text-[10px] text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 hover:bg-slate-50"
                          >
                            PNG
                          </a>
                          <a
                            href={`/api/qrcode?type=svg&url=${encodeURIComponent(m.url)}`}
                            download={`qr-${m.code}.svg`}
                            className="text-[10px] text-slate-600 border border-slate-200 rounded-full px-2 py-0.5 hover:bg-slate-50"
                          >
                            SVG
                          </a>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border " +
                        (m.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200")
                      }
                    >
                      <span className="text-[8px]">●</span>
                      {m.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// Helper de formato
function formatMissionType(t: string): string {
  switch (t) {
    case "registration":
      return "Registro";
    case "photo":
      return "Foto";
    case "vote":
      return "Votación";
    case "tombola":
      return "Tómbola";
    case "stand_visit":
      return "Visita a stand";
    default:
      return t;
  }
}
