// app/api/checkin/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { CHECKIN_ABI, CHECKIN_CONTRACT } from "@/app/lib/contract";

type CheckState = { lastDate: string | null; streak: number; totalPoints: number };

const todayStr = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  try {
    console.log("🧩 /api/checkin called");

    const { playerAddress, displayName, onchain = false } = await req.json();
    console.log("📥 req body:", { playerAddress, displayName, onchain });

    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }

    const addr = playerAddress.toLowerCase();
    const stateKey = `${KV_KEYS.CHECKIN_STATE_PREFIX}${addr}`;

    console.log("🗝️ stateKey:", stateKey);

    // mevcut state
    const raw = (await kv.get<CheckState>(stateKey)) || { lastDate: null, streak: 0, totalPoints: 0 };
    console.log("📦 raw state:", raw);

    const t = todayStr();

    // aynı gün tekrar claim edilmesin
    if (raw.lastDate === t) {
      console.log("🕒 already claimed today");
      return NextResponse.json({
        ok: true,
        alreadyToday: true,
        streak: raw.streak,
        add: 0,
        totalPoints: raw.totalPoints,
      });
    }

    // streak hesabı
    let streak = 1;
    if (raw.lastDate) {
      const last = new Date(`${raw.lastDate}T00:00:00Z`).getTime();
      const now = new Date(`${t}T00:00:00Z`).getTime();
      const diffDays = Math.round((now - last) / 86400000);
      streak = diffDays === 1 ? raw.streak + 1 : 1;
    }

    // puan: +5 günlük, 3’ün katında +10 bonus
    let add = 5;
    if (streak % 3 === 0) add += 10;
    const totalPoints = (raw.totalPoints || 0) + add;
    console.log("🎯 new streak:", streak, "add:", add, "total:", totalPoints);

    // KV — kullanıcı state
    await kv.set<CheckState>(stateKey, { lastDate: t, streak, totalPoints });
    console.log("💾 state saved");

    // KV — global check-in leaderboard increment
    await kv.zincrby(KV_KEYS.CHECKIN_POINTS_ZSET, add, addr);
    console.log("📈 leaderboard incremented");

    // KV — görüntü adını cache’le
    if (displayName) {
      await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });
      console.log("👤 displayName cached:", displayName);
    }

    // (opsiyonel) On-chain checkin puanı yaz
    if (onchain) {
      console.log("⛓️ writing on-chain...");
      const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC!);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
      const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, signer);
      await (await contract.checkInFor(playerAddress, add)).wait();
      console.log("✅ on-chain tx confirmed");
    }

    console.log("✅ checkin complete");

    return NextResponse.json({ ok: true, streak, add, totalPoints });
  } catch (e: any) {
    console.error("💥 checkin error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error", stack: e?.stack ?? "" },
      { status: 500 }
    );
  }
}
