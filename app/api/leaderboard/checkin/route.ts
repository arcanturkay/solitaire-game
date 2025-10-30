// app/api/leaderboard/checkin/route.ts
import { NextResponse } from "next/server";
import { kv, KV_KEYS } from "@/app/lib/kv";

// GET ?limit=20
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

    // En yüksek puanlar sonda olduğundan, -limit..-1 aralığı
    const raw = await kv.zrange(KV_KEYS.CHECKIN_POINTS_ZSET, -limit, -1, { withScores: true });

    // Upstash "withScores" dizisini [member, score, member, score, ...] döndürür
    const items: { address: string; points: number }[] = [];
    for (let i = raw.length - 2, rank = 1; i >= 0; i -= 2, rank++) {
      items.push({ address: String(raw[i]), points: Number(raw[i + 1]) });
    }

    const names = await kv.hgetall<Record<string, string>>(KV_KEYS.PROFILE_HASH);
    const withNames = items.map((r) => ({
      ...r,
      name: names?.[r.address] || `${r.address.slice(0, 6)}...${r.address.slice(-4)}`,
    }));

    return NextResponse.json({ ok: true, items: withNames });
  } catch (e: any) {
    console.error("checkin leaderboard error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "internal error" }, { status: 500 });
  }
}
