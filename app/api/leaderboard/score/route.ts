//app/api/leaderboard/score/route.ts

export const dynamic = "force-dynamic";

import { kv, KV_KEYS } from "@/app/lib/kv";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);

    // 🧮 KV'den en yüksek skorları al
    const raw = await kv.zrange(KV_KEYS.SCORE_ZSET, 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    // 🧠 Bazı SDK versiyonlarında flat array döner → normalize et
    let pairs: [string, number][] = [];
    if (Array.isArray(raw)) {
      if (typeof raw[0] === "string" && typeof raw[1] === "number") {
        for (let i = 0; i < raw.length; i += 2) {
          pairs.push([raw[i] as string, Number(raw[i + 1])]);
        }
      } else {
        pairs = raw as [string, number][];
      }
    }

    // 🧩 Kullanıcı adlarını profilden getir
    const result = await Promise.all(
      pairs.map(async ([addr, score]) => {
        const name =
          (await kv.hget(KV_KEYS.PROFILE_HASH, addr)) || addr.slice(0, 8);
        return { name, score };
      })
    );

    // ✅ Yanıt döndür
    return NextResponse.json(
      { ok: true, items: result },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e: any) {
    console.error("💥 leaderboard/score error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
