export const metadata = {
    title: "Solitaire MiniApp",
    description: "Play Solitaire directly on Farcaster",
    other: {
        "fc:frame": "vNext",
        "og:image": "https://solitaire-game.vercel.app/splash-200.png",
        "fc:frame:image": "https://solitaire-game.vercel.app/splash-200.png",
        "fc:frame:button:1": "Play Solitaire",
        "fc:frame:post_url": "https://solitaire-game.vercel.app/api/start",
    },
};

'use client';
import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);

    useEffect(() => {
        if (showSplash) return; // splash bitmeden kimlik kontrolü yapılmaz

        try {
            const fc = (window as any).farcaster?.user;
            if (fc?.fid) {
                // ✅ Farcaster MiniApp içindeysek user kimliği otomatik gelir
                setPlayerId(`fid:${fc.fid}`);
            } else {
                // 🌐 Normal tarayıcı veya local test için fallback
                setPlayerId('@guest');
            }
        } catch {
            setPlayerId('@guest');
        }
    }, [showSplash]);

    if (showSplash)
        return <SplashScreen onFinish={() => setShowSplash(false)} />;

    if (!playerId)
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting...
            </p>
        );

    return <SolitaireGame playerId={playerId} />;
}
