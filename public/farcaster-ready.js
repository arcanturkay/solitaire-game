// public/farcaster-ready.js
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@latest";

(async () => {
    try {
        const isMiniApp =
            window?.location?.hostname?.includes("wallet.farcaster.xyz") ||
            window?.location?.hostname?.includes("farcaster.xyz") ||
            window?.location?.hostname?.includes("warpcast.com");

        if (isMiniApp) {
            console.log("🟢 Farcaster SDK preload starting...");
            await sdk.actions.ready();
            console.log("✅ Farcaster SDK ready() called successfully (global preload)");
        } else {
            // 🧩 Mock mode: localhost veya web test ortamı
            console.log("⚪ Running in Web/Localhost mode — mock SDK activated");
            window.farcaster = { mock: true };
        }
    } catch (err) {
        console.warn("⚠️ Farcaster SDK preload failed:", err);
    }
})();
