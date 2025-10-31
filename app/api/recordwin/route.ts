// app/api/recordwin/route.ts

export const runtime = "nodejs"; // ✅ Node runtime for ethers

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { CHECKIN_ABI } from "@/app/lib/contract";

export async function POST(req: Request) {
  try {
    const { playerAddress, score, displayName, simulate = false } = await req.json();

    // ---- Validation ----
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }

    const s = Number(score);
    if (!s || s <= 0) {
      return NextResponse.json({ ok: false, error: "bad score" }, { status: 400 });
    }

    // ---- Simulation Mode (only for dev/test) ----
    if (simulate || process.env.NODE_ENV !== "production") {
      console.log("🧪 Simulating recordWin:", { playerAddress, score, displayName });
      await new Promise((r) => setTimeout(r, 800));
      const fakeTxHash = "0xSIMULATED" + Math.random().toString(16).slice(2, 10);
      console.log("✅ Simulated txHash:", fakeTxHash);

      const addr = playerAddress.toLowerCase();
      await kv.zincrby(KV_KEYS.SCORE_ZSET, s, addr);
      if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });

      return NextResponse.json({
        ok: true,
        simulated: true,
        txHash: fakeTxHash,
        contract: "SIMULATED_ENV",
      });
    }

    // ---- Real On-chain Mode ----
    const rpc = process.env.BASE_RPC;
    const pk = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CHECKIN_CONTRACT!;

    if (!rpc || !pk) {
      throw new Error("Missing BASE_RPC or PRIVATE_KEY in environment");
    }

    const provider = new ethers.JsonRpcProvider(rpc);
    const signer = new ethers.Wallet(pk, provider);
    const contract = new ethers.Contract(contractAddress, CHECKIN_ABI, signer);

    console.log("⚙️ recordWinFor params:", {
      player: playerAddress,
      score: s,
      signer: signer.address,
      contract: contractAddress,
    });

    // 🧠 Verify signer is contract owner
    const owner = await contract.owner();
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      throw new Error(`Signer is not owner (contract owner = ${owner})`);
    }

    console.log("🚀 Sending tx...");
    const tx = await contract.recordWinFor(playerAddress, s);
    console.log("⏳ Tx sent:", tx.hash);

    let txHash: string | null = null;
    try {
      const rc = await tx.wait(1); // wait for 1 confirmation (usually enough on Base)
      txHash = rc?.hash || tx.hash;
      console.log("✅ Tx confirmed:", txHash);
    } catch (waitErr) {
      console.warn("⚠️ tx.wait() timeout, falling back to polling...");
      const receipt = await provider.waitForTransaction(tx.hash, 1, 20000); // 20s fallback
      if (receipt) {
        txHash = receipt.hash;
        console.log("✅ Tx confirmed via polling:", txHash);
      } else {
        console.error("❌ Tx unconfirmed after fallback");
      }
    }

    // ---- KV update (always done) ----
    const addr = playerAddress.toLowerCase();
    await kv.zincrby(KV_KEYS.SCORE_ZSET, s, addr);
    if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });

    return NextResponse.json({
      ok: true,
      txHash,
      contract: contractAddress,
      onchainFailed: !txHash,
    });
  } catch (e: any) {
    console.error("💥 recordWin error:", e);
    return NextResponse.json(
        { ok: false, error: e?.message ?? "internal error" },
        { status: 500 }
    );
  }
}
