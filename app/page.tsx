'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [playerId, setPlayerId] = useState<string | null>(null);

    // Ortam kontrolü (Warpcast mi, web mi)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const insideMiniApp =
                window.location.hostname.includes('wallet.farcaster.xyz') ||
                window.location.hostname.includes('farcaster.xyz') ||
                window.location.hostname.includes('warpcast.com');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    // Splash bitmediyse splash göster
    if (showSplash) {
        return (
            <SplashScreen
                onFinish={(player) => {
                    setPlayerId(player);
                    setShowSplash(false);
                }}
            />
        );
    }

    // Oyun ekranı
    return (
        <div
            style={{
                backgroundColor: '#08401B',
                color: 'white',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: '24px',
            }}
        >
            {playerId && (
                <div style={{ marginBottom: '16px', fontSize: '1.1rem' }}>
                    👋 Welcome <strong>{playerId}</strong> 🎮
                </div>
            )}

            <SolitaireGame playerId={playerId || '@unknown'} />
        </div>
    );
}
