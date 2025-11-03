// app/api/recordwin/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { CHECKIN_CONTRACT, CHECKIN_ABI } from "@/app/lib/contract";

export async function POST(req: Request) {
  try {
    const { playerAddress, score, displayName } = await req.json();

    // --- Validation ---
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }
    const s = Number(score);
    if (!s || s <= 0) {
      return NextResponse.json({ ok: false, error: "bad score" }, { status: 400 });
    }

    const addr = playerAddress.toLowerCase();

    // --- 1️⃣ KV Güncellemesi (offchain kayıt tutma) ---
    await kv.zincrby(KV_KEYS.SCORE_ZSET, s, addr);
    if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });

    // --- 2️⃣ On-chain kayıt (her kullanıcı fee öder) ---
    const rpc = process.env.BASE_RPC;
    const pk = process.env.PRIVATE_KEY; // backend cüzdan değil, sadece kontrat bilgisi doğrulama için
    if (!rpc) throw new Error("Missing BASE_RPC");

    const provider = new ethers.JsonRpcProvider(rpc);

    // Kullanıcı kendi cüzdanından gas ödeyecek — frontend’de signer bağlanıyor.
    // Burada backend sadece referans olarak kontratı gösteriyor.
    const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, provider);

    console.log("🚀 recordMyWin() çağrısı gönderiliyor...");

    // ✅ Kullanıcı tarafında yapılacak işlem:
    // const { contract, signer } = await getUserContract();
    // const tx = await contract.recordMyWin(score, { value: ethers.parseEther("0.0002") });

    // Backend bu noktada sadece KV güncellemesi döner:
    return NextResponse.json({
      ok: true,
      stored: true,
      score: s,
      player: addr,
      message:
        "✅ Score saved in KV. Frontend should now call recordMyWin(score, { value: winFee }) onchain.",
    });
  } catch (e: any) {
    console.error("💥 recordWin error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
