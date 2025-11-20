"use client";

import { useEffect, useState } from "react";

const DOMAIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function QRPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [png, setPng] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const targetUrl = `${DOMAIN}/misiones/${slug}`;
      const res = await fetch(`/api/qrcode?url=${encodeURIComponent(targetUrl)}`);
      const json = await res.json();
      setPng(json.png);
    };
    load();
  }, [slug]);

  if (!png) {
    return <p className="p-8 text-center text-slate-500">Generando QR…</p>;
  }

  return (
    <div className="w-full flex flex-col items-center py-10 space-y-6">
      <h1 className="text-lg font-semibold">
        QR para misión: <span className="text-amber-600">{slug}</span>
      </h1>

      <img
        src={png}
        alt={`QR ${slug}`}
        className="w-64 h-64 rounded-xl shadow"
      />

      <p className="text-xs text-slate-500">
        URL: {DOMAIN}/misiones/{slug}
      </p>
    </div>
  );
}
