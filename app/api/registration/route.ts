// app/api/registration/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RegistrationBody = {
  familySize: number | null;
  members: any[];          // puedes tipar esto mejor luego (FamilyMember[])
  area: string | null;
  interests: string[];
  teamName: string;
};

//export async function POST(){ return new Response(JSON.stringify({ok:true}),{status:200}); }

/*

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Nueva familia registrada:", body);
    // TODO: guardar en DB / Sheets / etc.
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al procesar registro:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}

*/

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationBody;

    // Validación mínima defensiva
    if (!body.familySize || body.familySize <= 0) {
      return new NextResponse("familySize inválido", { status: 400 });
    }
    if (!body.teamName || body.teamName.trim().length === 0) {
      return new NextResponse("teamName requerido", { status: 400 });
    }

    const { familySize, members, area, interests, teamName } = body;

    const { error } = await supabaseAdmin
      .from("bingo_registrations")
      .insert({
        family_size: familySize,
        area,
        interests,
        team_name: teamName,
        members // se guarda como jsonb
      });

    if (error) {
      console.error("Error Supabase insert:", error);
      return new NextResponse("Error al guardar en Supabase", { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error al procesar registro:", err);
    return new NextResponse("Bad Request", { status: 400 });
  }
}
