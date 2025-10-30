export const dynamic = "force-dynamic";

import { kv, KV_KEYS } from "@/app/lib/kv";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 20);

    const raw = await kv.zrange(KV_KEYS.SCORE_ZSET, 0, limit - 1, {
      rev: true,
      withScores: true,
    });

    const result = await Promise.all(
      raw.map(async ([addr, score]: [string, number]) => {
        const name =
          (await kv.hget(KV_KEYS.PROFILE_HASH, addr)) || addr.slice(0, 8);
        return { name, score };
      })
    );

    return NextResponse.json({ ok: true, items: result });
  } catch (e: any) {
    console.error("score leaderboard error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
