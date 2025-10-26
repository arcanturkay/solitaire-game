'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [player, setPlayer] = useState<{ fid: number; username: string; wallet?: string } | null>(null);
    const [notInFarcaster, setNotInFarcaster] = useState(false);

    useEffect(() => {
        if (showSplash) return;

        async function getFarcasterIdentity() {
            try {
                const fc = (window as any).farcaster?.miniapp;
                if (!fc?.context?.getUser) {
                    setNotInFarcaster(true);
                    return;
                }

                const user = await fc.context.getUser();
                if (!user?.fid) {
                    setNotInFarcaster(true);
                    return;
                }

                // ✅ Farcaster ID ve Wallet adresi (ilk verification)
                const wallet = Array.isArray(user.verifications) && user.verifications.length > 0
                    ? user.verifications[0]
                    : undefined;

                setPlayer({
                    fid: user.fid,
                    username: user.username ? `@${user.username}` : `fid:${user.fid}`,
                    wallet,
                });
            } catch (err) {
                console.warn('❌ Farcaster identity fetch failed', err);
                setNotInFarcaster(true);
            }
        }

        getFarcasterIdentity();
    }, [showSplash]);

    // splash ekranı
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // Farcaster dışı uyarısı
    if (notInFarcaster)
        return (
            <div
                style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: 'radial-gradient(circle at center, #0A5323 30%, #043011 100%)',
                    color: 'white',
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                    padding: 20,
                }}
            >
                <h2>⚠️ Please open in Farcaster</h2>
                <p style={{ opacity: 0.8 }}>This game only works inside Warpcast.</p>
            </div>
        );

    if (!player)
        return <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>Connecting...</p>;

    // Oyuna geç — Farcaster kimlik + wallet bilgisiyle
    return (
        <>
            <SolitaireGame playerId={player.username} />
            <div
                style={{
                    position: 'fixed',
                    bottom: 8,
                    right: 10,
                    fontSize: '0.75rem',
                    opacity: 0.8,
                    color: 'white',
                }}
            >
                👤 {player.username}
                {player.wallet && (
                    <div style={{ fontSize: '0.7rem', color: '#b8ffc8' }}>
                        {player.wallet.slice(0, 6)}…{player.wallet.slice(-4)}
                    </div>
                )}
            </div>
        </>
    );
}
