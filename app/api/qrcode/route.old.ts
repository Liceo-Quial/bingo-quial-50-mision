import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url", { status: 400 });
  }

  try {
    const png = await QRCode.toDataURL(url);
    return NextResponse.json({ png });
  } catch (err) {
    console.error("QR generation error:", err);
    return new NextResponse("Error generating QR", { status: 500 });
  }
}
