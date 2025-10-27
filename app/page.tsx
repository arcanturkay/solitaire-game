'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';
import ConnectFarcasterButton from './components/ConnectFarcasterButton';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [isMiniApp, setIsMiniApp] = useState(false);
    const [walletConnected, setWalletConnected] = useState(false);
    const [playerId, setPlayerId] = useState('@guest');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const insideMiniApp =
                window.location.hostname.includes('wallet.farcaster.xyz') ||
                window.location.hostname.includes('farcaster.xyz') ||
                window.location.hostname.includes('warpcast.com');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    if (isMiniApp) {
        if (walletConnected) {
            return <SolitaireGame playerId={playerId} />;
        } else {
            return (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                    <h2>Connect your Farcaster wallet to play 🎮</h2>
                    <ConnectFarcasterButton />
                </div>
            );
        }
    }

    // fallback (sandbox dışı)
    return <SolitaireGame playerId={playerId} />;
}
