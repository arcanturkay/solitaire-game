// public/farcaster-ready.js
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@latest";

(() => {
    const isMiniApp =
        window?.location?.hostname?.includes("wallet.farcaster.xyz") ||
        window?.location?.hostname?.includes("farcaster.xyz") ||
        window?.location?.hostname?.includes("warpcast.com");

    if (!isMiniApp) {
        console.log("⚪ Not inside Farcaster — skipping SDK preload");
        return;
    }

    console.log("🟢 Farcaster MiniApp detected — SDK preloaded");
    window.__FARCASTER_ENV__ = true; // global flag
})();
