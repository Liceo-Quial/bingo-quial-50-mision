import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");
  const type = url.searchParams.get("type") ?? "png"; // png | svg

  if (!target) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  try {
    if (type === "svg") {
      const svg = await QRCode.toString(target, { type: "svg" });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "no-store",
        },
      });
    }

    // default PNG (base64)
    const png = await QRCode.toDataURL(target);

    // data:image/png;base64,iVBORw...
    const base64 = png.split(",")[1];
    const imgBuffer = Buffer.from(base64, "base64");

    return new NextResponse(imgBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return new NextResponse("Error generating QR", { status: 500 });
  }
}
