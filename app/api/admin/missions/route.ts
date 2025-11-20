// app/api/admin/missions/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const EVENT_CODE = process.env.BINGO_EVENT_CODE ?? "bingo_quial_2025";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function GET() {
  try {
    // Evento actual
    const { data: event, error: eventError } = await supabaseAdmin
      .from("events")
      .select("id, code, name, event_date, location")
      .eq("code", EVENT_CODE)
      .single();

    if (eventError || !event) {
      console.error("Error loading event:", eventError);
      return new NextResponse("Evento no configurado", { status: 500 });
    }

    // Misiones del evento
    const { data: missions, error: missionsError } = await supabaseAdmin
      .from("missions")
      .select(
        "id, code, name, description, mission_type, points, qr_slug, is_active"
      )
      .eq("event_id", event.id);

    if (missionsError) {
      console.error("Error loading missions:", missionsError);
      return new NextResponse("Error cargando misiones", { status: 500 });
    }

    const enrichedMissions = (missions ?? []).map((m) => {
      const url =
        m.qr_slug != null
          ? `${SITE_URL}/misiones/${m.qr_slug}`
          : null;

      return {
        ...m,
        url,
      };
    });

    return NextResponse.json(
      {
        event,
        missions: enrichedMissions,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (err) {
    console.error("Error GET /api/admin/missions:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
