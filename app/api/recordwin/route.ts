// app/api/recordwin/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { CHECKIN_ABI } from "@/app/lib/contract";

export async function POST(req: Request) {
  try {
    const { playerAddress, score, displayName, simulate = false } = await req.json();

    // --- Validation ---
    if (!playerAddress || !ethers.isAddress(playerAddress)) {
      return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
    }
    const s = Number(score);
    if (!s || s <= 0) {
      return NextResponse.json({ ok: false, error: "bad score" }, { status: 400 });
    }

    // 🧪 Simulation mode (for local / test)
    if (simulate) {
      console.log("🧪 Simulating recordWin:", { playerAddress, score, displayName });
      await new Promise((r) => setTimeout(r, 1200));
      const fakeTxHash = "0xSIMULATED" + Math.random().toString(16).slice(2, 10);

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

    // --- Blockchain setup ---
    const rpc = process.env.BASE_RPC;
    const pk = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CHECKIN_CONTRACT!;

    if (!rpc || !pk) {
      console.warn("⚠️ Missing RPC or PRIVATE_KEY env, skipping on-chain write");
    }

    let txHash: string | null = null;
    let onchainFailed = false;

    if (rpc && pk) {
      try {
        const provider = new ethers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(pk, provider);
        const contract = new ethers.Contract(contractAddress, CHECKIN_ABI, signer);

        // ✅ Blast fix: always fetch nonce including pending txs
        const nonce = await provider.getTransactionCount(signer.address, "pending");
        console.log("📮 Using nonce:", nonce);

        console.log("⚙️ recordWinFor params:", {
          player: playerAddress,
          score: s,
          signer: signer.address,
          contract: contractAddress,
        });

        // Optional owner check
        const owner = await contract.owner();
        if (owner.toLowerCase() !== signer.address.toLowerCase()) {
          console.warn(`⚠️ Signer is not owner (contract owner = ${owner})`);
        }

        console.log("🚀 Sending tx...");
        const tx = await contract.recordWinFor(playerAddress, s, { nonce });
        console.log("⏳ Tx sent:", tx.hash);

        try {
          const rc = await tx.wait();
          txHash = rc?.transactionHash || tx.hash;
          console.log("✅ Tx confirmed:", txHash);
        } catch (waitErr) {
          // 🩹 Eğer tx broadcast edildiyse ama timeout yediyse
          txHash = tx.hash;
          onchainFailed = false;
          console.warn("⚠️ Tx sent but not confirmed yet:", tx.hash);
        }
      } catch (chainErr: any) {
        onchainFailed = true;
        console.error("⚠️ On-chain recordWin failed:", chainErr);

        // 🩹 Eğer nonce veya network hatası olsa bile tx broadcast edildiyse, başarısız gösterme
        if (chainErr?.transaction?.hash) {
          txHash = chainErr.transaction.hash;
          onchainFailed = false;
          console.warn("⚠️ Treating unconfirmed tx as success:", txHash);
        }
      }
    }

    // --- KV güncelle (her durumda yapılır) ---
    const addr = playerAddress.toLowerCase();
    await kv.zincrby(KV_KEYS.SCORE_ZSET, s, addr);
    if (displayName) await kv.hset(KV_KEYS.PROFILE_HASH, { [addr]: displayName });

    return NextResponse.json({
      ok: true,
      tx: txHash,
      contract: contractAddress,
      onchainFailed,
    });
  } catch (e: any) {
    console.error("💥 recordWin error:", e);
    return NextResponse.json(
        { ok: false, error: e?.message ?? "internal error" },
        { status: 500 }
    );
  }
}
