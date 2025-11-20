// app/api/missions/[slug]/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EVENT_CODE = process.env.BINGO_EVENT_CODE ?? "bingo_quial_2025";

export async function GET(
  _req: Request,
  context: { params: { slug: string } }
) {
  const slug = context.params.slug;

  try {
    // 1) Evento
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, code, name")
      .eq("code", EVENT_CODE)
      .single();

    if (eventError || !event) {
      console.error("No event for missions:", eventError);
      return new NextResponse("Evento no configurado", { status: 500 });
    }

    // 2) Misión por slug
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("id, code, name, description, mission_type, points, qr_slug")
      .eq("event_id", event.id)
      .eq("qr_slug", slug)
      .eq("is_active", true)
      .single();

    if (missionError || !mission) {
      return new NextResponse("Misión no encontrada", { status: 404 });
    }

    return NextResponse.json(
      {
        event,
        mission,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Error GET /api/missions/[slug]:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
