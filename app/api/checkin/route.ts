// app/api/checkin/route.ts
export const runtime = "nodejs";

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
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }

    const addr = playerAddress.toLowerCase();
    const stateKey = `${KV_KEYS.CHECKIN_STATE_PREFIX}${addr}`;

    // 📦 read previous state
    const raw = (await kv.get<CheckState>(stateKey)) || { lastDate: null, streak: 0, totalPoints: 0 };
    const t = todayStr();

    // ⏳ prevent multiple same-day claims
    if (raw.lastDate === t) {
      return NextResponse.json({
        ok: true,
        alreadyToday: true,
        streak: raw.streak,
        add: 0,
        totalPoints: raw.totalPoints,
      });
    }

    // 🔁 streak calculation
    let streak = 1;
    if (raw.lastDate) {
      const last = new Date(`${raw.lastDate}T00:00:00Z`).getTime();
      const now = new Date(`${t}T00:00:00Z`).getTime();
      const diffDays = Math.round((now - last) / 86400000);
      streak = diffDays === 1 ? raw.streak + 1 : 1;
    }

    // 🪙 reward calc
    let add = 5;
    if (streak % 3 === 0) add += 10;
    const totalPoints = (raw.totalPoints || 0) + add;

    // 💾 save state
    await kv.set<CheckState>(stateKey, { lastDate: t, streak, totalPoints });
    await kv.zincrby(KV_KEYS.CHECKIN_POINTS_ZSET, add, addr);
    if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });

    console.log(`💾 Check-in updated for ${addr} (+${add}) streak=${streak}`);

    // ⛓️ onchain logic (optional)
    let txHash: string | null = null;
    let onchainFailed = false;

    if (onchain) {
      try {
        const rpc = process.env.BASE_RPC;
        const pk = process.env.PRIVATE_KEY;
        if (!rpc || !pk) throw new Error("Missing RPC or PRIVATE_KEY");

        const provider = new ethers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(pk, provider);
        const contract = new ethers.Contract(CHECKIN_CONTRACT, CHECKIN_ABI, signer);

        // ✅ Blast fix: get nonce including pending
        const nonce = await provider.getTransactionCount(signer.address, "pending");
        console.log("📮 Using nonce:", nonce);

        console.log("🚀 Sending onchain check-in...");
        const tx = await contract.checkInFor(playerAddress, add, { nonce });
        console.log("⏳ Tx sent:", tx.hash);

        try {
          const rc = await tx.wait();
          txHash = rc?.transactionHash || tx.hash;
          console.log("✅ Tx confirmed:", txHash);
        } catch (waitErr) {
          // 🩹 Treat unconfirmed but broadcasted tx as success
          txHash = tx.hash;
          onchainFailed = false;
          console.warn("⚠️ Tx sent but not yet confirmed:", tx.hash);
        }
      } catch (chainErr: any) {
        onchainFailed = true;
        console.error("⚠️ On-chain failed:", chainErr);

        // 🩹 If tx exists but failed confirm, mark as soft success
        if (chainErr?.transaction?.hash) {
          txHash = chainErr.transaction.hash;
          onchainFailed = false;
          console.warn("⚠️ Treating unconfirmed tx as success:", txHash);
        }
      }
    }

    console.log("✅ checkin complete");

    return NextResponse.json({
      ok: true,
      streak,
      add,
      totalPoints,
      txHash,
      onchainFailed,
    });
  } catch (e: any) {
    console.error("💥 checkin error:", e);
    return NextResponse.json(
        { ok: false, error: e?.message ?? "internal error", stack: e?.stack ?? "" },
        { status: 500 }
    );
  }
}