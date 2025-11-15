import { NextResponse } from "next/server";

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
