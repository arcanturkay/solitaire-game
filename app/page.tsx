'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (showSplash) return;

        async function resolvePlayer() {
            try {
                // ✅ Wait for Farcaster MiniApp SDK to be ready
                await new Promise<void>((resolve) => {
                    const checkReady = () => {
                        if ((window as any)?.farcaster?.miniapp?.actions?.ready) {
                            resolve();
                        } else {
                            setTimeout(checkReady, 150);
                        }
                    };
                    checkReady();
                });

                const fc = (window as any)?.farcaster?.miniapp;
                let user: any = null;

                // ✅ Modern SDK: context.getUser()
                if (fc?.context?.getUser) {
                    user = await fc.context.getUser().catch(() => null);
                }

                // ✅ Legacy SDK fallback
                if (!user && (window as any)?.farcaster?.user) {
                    user = (window as any).farcaster.user;
                }

                if (user?.fid) {
                    const username =
                        user.username || (user.displayName ? user.displayName.replace(/\s+/g, '') : null);
                    setPlayerId(username ? `@${username}` : `fid:${user.fid}`);
                } else {
                    // Running outside of Farcaster client (e.g. preview tool)
                    setPlayerId('@guest');
                }
            } catch (err) {
                console.warn('Farcaster user fetch failed:', err);
                setError('Unable to connect to Farcaster.');
                setPlayerId('@guest');
            }
        }

        resolvePlayer();
    }, [showSplash]);

    // ⏳ Splash screen
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // 🧱 Connection error overlay
    if (error) {
        return (
            <div id="farcaster-wall">
                <h2>⚠️ Connection Error</h2>
                <p>{error}</p>
                <p>Please open this game inside the Farcaster client.</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        background: '#1D4ED8',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ⌛ Connecting status
    if (!playerId) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting to Farcaster...
            </p>
        );
    }

    // 🎮 Launch the game
    return <SolitaireGame playerId={playerId} />;
}
