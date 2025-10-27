// public/farcaster-ready.js
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@latest";

(async () => {
    try {
        // Warpcast veya Farcaster miniapp ortamında çalışıyorsa
        if (window?.farcaster || window?.location?.hostname?.includes("farcaster.xyz")) {
            console.log("🟢 Farcaster SDK preload starting...");
            await sdk.actions.ready();
            console.log("✅ Farcaster SDK ready() called successfully (global preload)");
        } else {
            console.log("⚪ Running outside Farcaster miniapp — skipping sdk.ready()");
        }
    } catch (err) {
        console.warn("⚠️ Farcaster SDK preload failed:", err);
    }
})();
