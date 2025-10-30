// app/api/recordwin/route.ts
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { CHECKIN_ABI } from "@/app/lib/contract";

export async function POST(req: Request) {
  try {
    const { playerAddress, score, displayName } = await req.json();

    // ---- Validation ----
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }

    const s = Number(score);
    if (!s || s <= 0) {
      return NextResponse.json({ ok: false, error: "bad score" }, { status: 400 });
    }

    // ---- Blockchain setup ----
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC!);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    const contractAddress = process.env.CHECKIN_CONTRACT!;

    console.log("⚙️ recordWinFor params:", {
      player: playerAddress,
      score: s,
      signer: signer.address,
      contract: contractAddress,
    });

    const contract = new ethers.Contract(contractAddress, CHECKIN_ABI, signer);

    // 🧠 Ön kontrol: kontrat owner'ı bu signer mı?
    const owner = await contract.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`Signer is not owner (contract owner = ${owner})`);
    }

    // ---- Transaction ----
    console.log("🚀 Sending tx...");
    const tx = await contract.recordWinFor(playerAddress, s);
    console.log("⏳ Tx sent:", tx.hash);

    const rc = await tx.wait();
    console.log("✅ Tx confirmed:", rc.transactionHash);

    // ---- KV güncelle ----
    const addr = playerAddress.toLowerCase();
    await kv.zincrby(KV_KEYS.SCORE_ZSET, s, addr);
    if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, addr, displayName);

    return NextResponse.json({
      ok: true,
      txHash: rc.transactionHash,
      contract: contractAddress,
    });
  } catch (e: any) {
    console.error("💥 recordWin error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
