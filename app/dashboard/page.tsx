"use client";

import { useEffect, useState } from "react";

type DashboardResponse = {
  event: {
    id: string;
    code: string;
    name: string;
    event_date: string | null;
    location: string | null;
  };
  totals: {
    families: number;
    attendees: number;
    avgPerFamily: number;
  };
  areas: {
    area: string;
    families: number;
    attendees: number;
    attendeesPerFamily: number;
  }[];
  ageGroups: Record<string, number>;
  roles: {
    children: number;
    teens: number;
    adults: number;
    grandparents: number;
    staff: number;
  };
  interests: {
    id: string;
    count: number;
  }[];
  missions: {
    id: string;
    code: string;
    name: string;
    missionType: string;
    points: number;
    completedCount: number;
    completionRate: number;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as DashboardResponse;
        setData(json);
      } catch (err: any) {
        console.error("Error cargando dashboard:", err);
        setError("No se pudo cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Dashboard Bingo Quial</h1>
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6">
          <p className="text-sm text-slate-600">Cargando métricas…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Dashboard Bingo Quial</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">{error ?? "Error desconocido"}</p>
        </div>
      </div>
    );
  }

  const { event, totals, areas, ageGroups, roles, interests, missions } = data;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            Dashboard · {event.name ?? "Bingo Quial"}
          </h1>
          <p className="text-xs text-slate-500">
            Código: {event.code} ·{" "}
            {event.event_date ? `Fecha: ${event.event_date}` : "Fecha sin definir"}{" "}
            · {event.location ?? "Ubicación no registrada"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700 border border-emerald-100">
          <span className="text-[10px]">●</span> Datos en Supabase
        </span>
      </header>

      {/* Cards métricas principales */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Familias registradas"
          value={totals.families}
          icon="👨‍👩‍👧‍👦"
        />
        <MetricCard
          label="Asistentes estimados"
          value={totals.attendees}
          icon="🎟️"
        />
        <MetricCard
          label="Promedio por familia"
          value={totals.avgPerFamily}
          icon="📊"
        />
      </section>

      {/* Distribución por área y roles */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-sm font-semibold mb-3">
            Distribución por zona de origen
          </h2>
          {areas.length === 0 ? (
            <p className="text-xs text-slate-500">Sin datos todavía.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="py-1 text-left">Zona</th>
                  <th className="py-1 text-right">Familias</th>
                  <th className="py-1 text-right">Asistentes</th>
                  <th className="py-1 text-right">Prom. x familia</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => (
                  <tr key={a.area} className="border-b border-slate-50">
                    <td className="py-1 capitalize">
                      {a.area === "desconocida" ? "No registrada" : a.area}
                    </td>
                    <td className="py-1 text-right">{a.families}</td>
                    <td className="py-1 text-right">{a.attendees}</td>
                    <td className="py-1 text-right">
                      {a.attendeesPerFamily.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-sm font-semibold mb-3">
            Composición por rol aproximado
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <RoleStat icon="🧒" label="Niños/as" value={roles.children} />
            <RoleStat icon="🎓" label="Adolescentes" value={roles.teens} />
            <RoleStat icon="🧍" label="Adultos" value={roles.adults} />
            <RoleStat icon="🧓" label="Abuelos" value={roles.grandparents} />
            <RoleStat icon="👩‍🏫" label="Docentes / staff" value={roles.staff} />
          </div>
        </div>
      </section>

      {/* Edad e intereses */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-sm font-semibold mb-3">Grupos de edad</h2>
          {Object.keys(ageGroups).length === 0 ? (
            <p className="text-xs text-slate-500">Sin datos todavía.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="py-1 text-left">Grupo</th>
                  <th className="py-1 text-right">Personas</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ageGroups).map(([group, count]) => (
                  <tr key={group} className="border-b border-slate-50">
                    <td className="py-1 text-left">{formatAgeGroup(group)}</td>
                    <td className="py-1 text-right">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <h2 className="text-sm font-semibold mb-3">Intereses familiares</h2>
          {interests.length === 0 ? (
            <p className="text-xs text-slate-500">Sin intereses seleccionados aún.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {interests.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between border-b border-slate-50 pb-1"
                >
                  <span className="capitalize">{formatInterest(i.id)}</span>
                  <span className="font-semibold">{i.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Misiones */}
      <section className="rounded-2xl border border-slate-200 bg-white/80 p-4">
        <h2 className="text-sm font-semibold mb-3">Misiones del evento</h2>
        {missions.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay misiones configuradas para este evento.
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead className="text-slate-500">
              <tr className="border-b border-slate-100">
                <th className="py-1 text-left">Misión</th>
                <th className="py-1 text-left">Tipo</th>
                <th className="py-1 text-right">Puntos</th>
                <th className="py-1 text-right">Completadas</th>
                <th className="py-1 text-right">% familias</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} className="border-b border-slate-50">
                  <td className="py-1">
                    <span className="font-medium">{m.name}</span>
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({m.code})
                    </span>
                  </td>
                  <td className="py-1 text-left text-slate-500 text-[11px]">
                    {formatMissionType(m.missionType)}
                  </td>
                  <td className="py-1 text-right">{m.points}</td>
                  <td className="py-1 text-right">{m.completedCount}</td>
                  <td className="py-1 text-right">{m.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// --------- Subcomponentes ---------

type MetricCardProps = {
  label: string;
  value: number;
  icon?: string;
};

function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">
        {icon ?? "📈"}
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-semibold">
          {Number.isFinite(value) ? value : "-"}
        </div>
      </div>
    </div>
  );
}

type RoleStatProps = {
  icon: string;
  label: string;
  value: number;
};

function RoleStat({ icon, label, value }: RoleStatProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-100">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-[11px] text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

// --------- Helpers de formato ---------

function formatAgeGroup(key: string): string {
  switch (key) {
    case "0_5":
      return "0–5 años";
    case "6_12":
      return "6–12 años";
    case "13_17":
      return "13–17 años";
    case "18_35":
      return "18–35 años";
    case "36_50":
      return "36–50 años";
    case "50_plus":
      return "50+ años";
    case "desconocido":
      return "Sin clasificar";
    default:
      return key;
  }
}

function formatInterest(id: string): string {
  switch (id) {
    case "sports":
      return "Deporte";
    case "games":
      return "Videojuegos";
    case "reading":
      return "Lectura";
    case "food":
      return "Gastronomía";
    case "music":
      return "Música";
    case "nature":
      return "Naturaleza";
    case "creativity":
      return "Creatividad";
    case "tech":
      return "Tecnología";
    case "art":
      return "Arte";
    default:
      return id;
  }
}

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
