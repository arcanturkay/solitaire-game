export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { kv, KV_KEYS } from "@/app/lib/kv";
import { ethers } from "ethers";

export async function POST(req: Request) {
    try {
        const { playerAddress, bonus, reason } = await req.json();

        // --- Validation ---
        if (!playerAddress || !ethers.isAddress(playerAddress)) {
            return NextResponse.json({ ok: false, error: "bad playerAddress" }, { status: 400 });
        }
        const b = Number(bonus);
        if (!b || b <= 0) {
            return NextResponse.json({ ok: false, error: "bad bonus" }, { status: 400 });
        }

        const addr = playerAddress.toLowerCase();

        // --- KV update (+bonus points) ---
        await kv.zincrby(KV_KEYS.SCORE_ZSET, b, addr);

        console.log(`🎁 Bonus +${b} added for ${addr} (${reason || "no reason"})`);

        return NextResponse.json({
            ok: true,
            player: addr,
            bonus: b,
            reason,
            message: `✅ +${b} bonus successfully added.`,
        });
    } catch (e: any) {
        console.error("💥 addscore error:", e);
        return NextResponse.json(
            { ok: false, error: e?.message ?? "internal error" },
            { status: 500 }
        );
    }
}
