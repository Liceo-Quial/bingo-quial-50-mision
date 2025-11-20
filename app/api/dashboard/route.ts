// app/api/dashboard/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EVENT_CODE = process.env.BINGO_EVENT_CODE ?? "bingo_quial_2025";

export async function GET() {
  try {
    // 1) Buscar evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, code, name, event_date, location")
      .eq("code", EVENT_CODE)
      .single();

    if (eventError || !event) {
      console.error("Error buscando evento:", eventError);
      return new NextResponse("Evento no configurado", { status: 500 });
    }

    // 2) Cargar registros del evento
    const { data: registrations, error: regError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, household_id, family_size, area, interests, event_id")
      .eq("event_id", event.id);

    if (regError) {
      console.error("Error cargando event_registrations:", regError);
      return new NextResponse("Error cargando registros", { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      // No hay datos aún, devolvemos estructura vacía pero válida
      return NextResponse.json({
        event,
        totals: {
          families: 0,
          attendees: 0
        },
        areas: [],
        ageGroups: {},
        roles: {},
        interests: [],
        missions: []
      });
    }

    const householdIds = registrations
      .map((r) => r.household_id)
      .filter(Boolean) as string[];

    // 3) Cargar miembros de esas familias
    const { data: members, error: membersError } = await supabaseAdmin
      .from("family_members")
      .select(
        "household_id, role, gender, approx_age_group, is_student, is_staff"
      )
      .in("household_id", householdIds);

    if (membersError) {
      console.error("Error cargando family_members:", membersError);
      return new NextResponse("Error cargando miembros", { status: 500 });
    }

    // 4) Cargar misiones y sus completions
    const { data: missions, error: missionsError } = await supabaseAdmin
      .from("missions")
      .select("id, code, name, points, mission_type")
      .eq("event_id", event.id)
      .eq("is_active", true);

    if (missionsError) {
      console.error("Error cargando missions:", missionsError);
      return new NextResponse("Error cargando misiones", { status: 500 });
    }

    let missionCompletions: any[] = [];
    if (missions && missions.length > 0) {
      const missionIds = missions.map((m) => m.id);
      const { data: mcData, error: mcError } = await supabaseAdmin
        .from("mission_completions")
        .select("mission_id, registration_id")
        .in("mission_id", missionIds);

      if (mcError) {
        console.error("Error cargando mission_completions:", mcError);
        // no rompas el dashboard por esto, seguimos sin misiones
        missionCompletions = [];
      } else {
        missionCompletions = mcData ?? [];
      }
    }

    // -----------------------
    // 5) Agregaciones en memoria
    // -----------------------

    // Totales
    const totalFamilies = registrations.length;
    const totalAttendees = registrations.reduce(
      (sum, r) => sum + (r.family_size ?? 0),
      0
    );

    // Por área
    const areaMap = new Map<
      string,
      { families: number; attendees: number }
    >();

    for (const r of registrations) {
      const key = r.area ?? "desconocida";
      const current = areaMap.get(key) ?? { families: 0, attendees: 0 };
      current.families += 1;
      current.attendees += r.family_size ?? 0;
      areaMap.set(key, current);
    }

    const areas = Array.from(areaMap.entries()).map(([area, stats]) => ({
      area,
      families: stats.families,
      attendees: stats.attendees,
      attendeesPerFamily:
        stats.families > 0
          ? Number((stats.attendees / stats.families).toFixed(2))
          : 0
    }));

    // Edad (approx_age_group)
    const ageGroupsCount: Record<string, number> = {};
    for (const m of members ?? []) {
      const group = m.approx_age_group ?? "desconocido";
      ageGroupsCount[group] = (ageGroupsCount[group] ?? 0) + 1;
    }

    // Roles (simplificado a categorías útiles)
    const rolesCount: Record<string, number> = {
      children: 0,
      teens: 0,
      adults: 0,
      grandparents: 0,
      staff: 0
    };

    for (const m of members ?? []) {
      switch (m.role) {
        case "girl":
        case "boy":
          rolesCount.children++;
          break;
        case "teen":
          rolesCount.teens++;
          break;
        case "mom":
        case "dad":
          rolesCount.adults++;
          break;
        case "grandparent":
          rolesCount.grandparents++;
          break;
        case "teacher":
          rolesCount.staff++;
          break;
        default:
          rolesCount.adults++;
      }
    }

    // Intereses
    const interestCount: Record<string, number> = {};
    for (const r of registrations) {
      const interests = (r.interests ?? []) as string[];
      for (const i of interests) {
        if (!i) continue;
        interestCount[i] = (interestCount[i] ?? 0) + 1;
      }
    }
    const interests = Object.entries(interestCount)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);

    // Misiones
    const missionStats = (missions ?? []).map((m) => {
      const completionsForMission = missionCompletions.filter(
        (mc) => mc.mission_id === m.id
      );
      const uniqueRegistrations = new Set(
        completionsForMission.map((mc) => mc.registration_id)
      );
      const completedCount = uniqueRegistrations.size;
      const completionRate =
        totalFamilies > 0
          ? Number(((completedCount / totalFamilies) * 100).toFixed(1))
          : 0;

      return {
        id: m.id,
        code: m.code,
        name: m.name,
        missionType: m.mission_type,
        points: m.points,
        completedCount,
        completionRate // %
      };
    });

    // Respuesta final
    return NextResponse.json({
      event,
      totals: {
        families: totalFamilies,
        attendees: totalAttendees,
        avgPerFamily:
          totalFamilies > 0
            ? Number((totalAttendees / totalFamilies).toFixed(2))
            : 0
      },
      areas,
      ageGroups: ageGroupsCount,
      roles: rolesCount,
      interests,
      missions: missionStats
    },
    {
    headers: {
      "Cache-Control": "no-store",
    },
  });
  } catch (err) {
    console.error("Error inesperado en /api/dashboard:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
