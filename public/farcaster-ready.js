// public/farcaster-ready.js
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk@latest";

(async () => {
    const isMiniApp =
        window?.location?.hostname?.includes("wallet.farcaster.xyz") ||
        window?.location?.hostname?.includes("farcaster.xyz") ||
        window?.location?.hostname?.includes("warpcast.com");

    if (!isMiniApp) {
        console.log("⚪ Not inside Farcaster — skipping sdk.ready()");
        return;
    }

    console.log("🟢 Farcaster MiniApp detected — preparing to call sdk.actions.ready()");

    let called = false;
    let attempts = 0;

    const tryReady = async () => {
        try {
            await sdk.actions.ready();
            called = true;
            console.log("✅ sdk.actions.ready() success (preload)");
        } catch (err) {
            console.warn("⚠️ sdk.actions.ready() failed, retrying...", err);
        }
    };

    const interval = setInterval(async () => {
        if (called || attempts > 40) {
            clearInterval(interval);
            if (called) console.log("🎯 sdk.ready() confirmed!");
            else console.error("❌ Failed to call sdk.ready() after multiple retries");
            return;
        }
        attempts++;
        await tryReady();
    }, 150);
})();
