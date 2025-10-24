'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (showSplash) return;
        try {
            const fc = (window as any).farcaster?.user;
            if (fc?.fid) setPlayerId(`fid:${fc.fid}`);
            else setPlayerId('@guest');
        } catch {
            setPlayerId('@guest');
        }
    }, [showSplash]);

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
    if (!playerId)
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting...
            </p>
        );

    return <SolitaireGame playerId={playerId} />;
}
