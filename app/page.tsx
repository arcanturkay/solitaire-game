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
                console.log('🟣 Checking for Farcaster SDK...');

                // ✅ Wait up to 2s for Farcaster MiniApp SDK
                await new Promise<void>((resolve) => {
                    let elapsed = 0;
                    const interval = setInterval(() => {
                        const fcReady = (window as any)?.farcaster?.miniapp?.actions?.ready;
                        elapsed += 150;
                        if (fcReady || elapsed >= 2000) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 150);
                });

                const fc = (window as any)?.farcaster?.miniapp;
                let user: any = null;

                // ✅ Try modern SDK
                if (fc?.context?.getUser) {
                    console.log('✅ Detected Farcaster MiniApp SDK (modern)');
                    user = await fc.context.getUser().catch((err: any) => {
                        console.warn('context.getUser() failed:', err);
                        return null;
                    });
                }

                // ✅ Try legacy path
                if (!user && (window as any)?.farcaster?.user) {
                    console.log('⚙️ Using legacy Farcaster SDK (window.farcaster.user)');
                    user = (window as any).farcaster.user;
                }

                // ✅ Log what we got
                console.log('📦 Farcaster user object:', user);

                if (user?.fid) {
                    const username =
                        user.username || (user.displayName ? user.displayName.replace(/\s+/g, '') : null);
                    const id = username ? `@${username}` : `fid:${user.fid}`;
                    console.log('✅ Connected as:', id);
                    setPlayerId(id);
                } else {
                    console.log('🟡 No Farcaster user detected → using @guest');
                    setPlayerId('@guest');
                }
            } catch (err) {
                console.error('❌ Farcaster user fetch failed:', err);
                setError('Unable to connect to Farcaster.');
                setPlayerId('@guest');
            }
        }

        resolvePlayer();
    }, [showSplash]);

    // ⏳ Splash
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // 🧱 Error wall
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

    // ⌛ Connecting text
    if (!playerId) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting to Farcaster...
            </p>
        );
    }

    // 🎮 Start game
    return <SolitaireGame playerId={playerId} />;
}
