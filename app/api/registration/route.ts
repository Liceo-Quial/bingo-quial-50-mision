// app/api/registration/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EVENT_CODE = process.env.BINGO_EVENT_CODE ?? "bingo_quial_2025";
const REGISTER_MISSION_CODE = "M1_REGISTER";

type IncomingMember = {
  id: string;
  role: "girl" | "boy" | "mom" | "dad" | "grandparent" | "teacher" | "teen";
};

type RegistrationBody = {
  familySize: number | null;
  members: IncomingMember[];
  area: string | null;
  interests: string[];
  teamName: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationBody;

    // Validaciones mínimas
    if (!body.familySize || body.familySize <= 0) {
      return new NextResponse("familySize inválido", { status: 400 });
    }
    if (!body.teamName || body.teamName.trim().length === 0) {
      return new NextResponse("teamName requerido", { status: 400 });
    }
    if (!Array.isArray(body.members) || body.members.length === 0) {
      return new NextResponse("members requerido", { status: 400 });
    }

    // 1) Obtener el evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("code", EVENT_CODE)
      .single();

    if (eventError || !event) {
      console.error("No se encontró el evento:", eventError);
      return new NextResponse("Evento no configurado", { status: 500 });
    }

    // 2) Crear household (una por registro en este MVP)
    const { data: household, error: householdError } = await supabaseAdmin
      .from("households")
      .insert({})
      .select("id")
      .single();

    if (householdError || !household) {
      console.error("Error creando household:", householdError);
      return new NextResponse("Error creando familia", { status: 500 });
    }

    const householdId = household.id as string;

    // 3) Insertar miembros normalizados
    const memberRows = body.members.map((m) => {
      const role = m.role;
      let gender: "male" | "female" | "other" | null = null;
      let approxAgeGroup:
        | "0_5"
        | "6_12"
        | "13_17"
        | "18_35"
        | "36_50"
        | "50_plus"
        | null = null;
      let isStudent = false;
      let isStaff = false;
      let isExternal = false;

      switch (role) {
        case "girl":
          gender = "female";
          approxAgeGroup = "6_12";
          isStudent = true;
          break;
        case "boy":
          gender = "male";
          approxAgeGroup = "6_12";
          isStudent = true;
          break;
        case "teen":
          approxAgeGroup = "13_17";
          isStudent = true;
          break;
        case "mom":
          gender = "female";
          approxAgeGroup = "36_50";
          break;
        case "dad":
          gender = "male";
          approxAgeGroup = "36_50";
          break;
        case "grandparent":
          approxAgeGroup = "50_plus";
          break;
        case "teacher":
          approxAgeGroup = "18_35";
          isStaff = true;
          break;
        default:
          isExternal = true;
      }

      return {
        household_id: householdId,
        role,
        gender,
        approx_age_group: approxAgeGroup,
        is_student: isStudent,
        is_staff: isStaff,
        is_external: isExternal,
      };
    });

    const { error: membersError } = await supabaseAdmin
      .from("family_members")
      .insert(memberRows);

    if (membersError) {
      console.error("Error insertando miembros:", membersError);
      return new NextResponse("Error guardando miembros", { status: 500 });
    }

    // 4) Crear registro del evento
    const { data: registration, error: registrationError } = await supabaseAdmin
      .from("event_registrations")
      .insert({
        event_id: event.id,
        household_id: householdId,
        family_size: body.familySize,
        area: body.area,
        interests: body.interests ?? [],
        team_name: body.teamName.trim(),
        source: body.source ?? "web",
        raw_payload: body,
      })
      .select("id")
      .single();

    if (registrationError || !registration) {
      console.error("Error creando event_registrations:", registrationError);
      return new NextResponse("Error creando registro del evento", {
        status: 500,
      });
    }

    const registrationId = registration.id as string;

    // 5) Completar misión de registro (si existe)
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("id")
      .eq("event_id", event.id)
      .eq("code", REGISTER_MISSION_CODE)
      .maybeSingle();

    if (missionError) {
      console.warn("Error buscando misión de registro:", missionError);
    }

    if (mission && mission.id) {
      const { error: completionError } = await supabaseAdmin
        .from("mission_completions")
        .insert({
          mission_id: mission.id,
          registration_id: registrationId,
          location_code: "registration-flow",
          data: {},
        });

      if (completionError) {
        console.warn("Error registrando completion de M1_REGISTER:", completionError);
        // No rompemos el flujo si falla esto
      }
    }

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      householdId,
      registrationId,
    });
  } catch (err) {
    console.error("Error inesperado en /api/registration:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
