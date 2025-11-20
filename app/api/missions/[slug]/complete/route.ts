// app/api/missions/complete/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EVENT_CODE = process.env.BINGO_EVENT_CODE ?? "bingo_quial_2025";

type CompleteBody = {
  missionSlug: string;    // ej: 'photo-spot'
  teamName: string;       // nombre del equipo que registraron
  locationCode?: string;  // opcional: 'photo-zone-1', 'stand-3'
  extraData?: any;        // ej: voto a un stand
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompleteBody;

    if (!body.missionSlug || !body.teamName) {
      return new NextResponse("Faltan parámetros", { status: 400 });
    }

    const teamNameNorm = body.teamName.trim();

    // 1) Evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, code, name")
      .eq("code", EVENT_CODE)
      .single();

    if (eventError || !event) {
      console.error("No event:", eventError);
      return new NextResponse("Evento no configurado", { status: 500 });
    }

    // 2) Misión por slug
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("id, code, name, mission_type, points")
      .eq("event_id", event.id)
      .eq("qr_slug", body.missionSlug)
      .eq("is_active", true)
      .single();

    if (missionError || !mission) {
      console.error("Mission not found:", missionError);
      return new NextResponse("Misión no encontrada", { status: 404 });
    }

    // 3) Registro de evento por nombre de equipo
    const { data: registration, error: regError } = await supabaseAdmin
      .from("event_registrations")
      .select("id, team_name")
      .eq("event_id", event.id)
      .ilike("team_name", teamNameNorm) // case-insensitive
      .maybeSingle();

    if (regError) {
      console.error("Error buscando registration:", regError);
      return new NextResponse("Error buscando familia", { status: 500 });
    }

    if (!registration) {
      return new NextResponse("No encontramos ese equipo", { status: 404 });
    }

    const registrationId = registration.id as string;

    // 4) Evitar duplicados (una completion por misión+registration+locationCode)
    const locationCode = body.locationCode ?? "default";

    const { data: existing, error: existError } = await supabaseAdmin
      .from("mission_completions")
      .select("id")
      .eq("mission_id", mission.id)
      .eq("registration_id", registrationId)
      .eq("location_code", locationCode)
      .maybeSingle();

    if (existError) {
      console.error("Error checking existing completion:", existError);
      return new NextResponse("Error validando misión", { status: 500 });
    }

    if (existing) {
      // Ya completó esta misión en este punto
      return NextResponse.json(
        {
          ok: true,
          alreadyCompleted: true,
          message: "Esta misión ya fue registrada para este equipo.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // 5) Insertar completion
    const { error: insertError } = await supabaseAdmin
      .from("mission_completions")
      .insert({
        mission_id: mission.id,
        registration_id: registrationId,
        location_code: locationCode,
        data: body.extraData ?? {},
      });

    if (insertError) {
      console.error("Error insert completion:", insertError);
      return new NextResponse("Error guardando misión", { status: 500 });
    }

    return NextResponse.json(
      {
        ok: true,
        alreadyCompleted: false,
        points: mission.points,
        mission: {
          code: mission.code,
          name: mission.name,
          missionType: mission.mission_type,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Error POST /api/missions/complete:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
