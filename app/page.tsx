'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (showSplash) return;

        // SDK üzerinden kullanıcıyı çekmeyi dene
        async function resolvePlayer() {
            try {
                // Miniapps SDK global: window.farcaster.miniapp
                const mini = (window as any)?.farcaster?.miniapp;
                if (mini?.context?.getUser) {
                    const user = await mini.context.getUser();
                    // user: { fid, username, displayName, ... } şeklinde gelir
                    if (user?.fid) {
                        setPlayerId(user.username ? `@${user.username}` : `fid:${user.fid}`);
                        return;
                    }
                }

                // Eski/fallback yol: bazı istemciler window.farcaster.user taşır
                const legacy = (window as any)?.farcaster?.user;
                if (legacy?.fid) {
                    setPlayerId(legacy.username ? `@${legacy.username}` : `fid:${legacy.fid}`);
                    return;
                }

                // Olmadı, guest
                setPlayerId('@guest');
            } catch {
                setPlayerId('@guest');
            }
        }

        resolvePlayer();
    }, [showSplash]);

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    if (!playerId) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting...
            </p>
        );
    }

    return <SolitaireGame playerId={playerId} />;
}