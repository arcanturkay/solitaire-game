'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';
import ConnectFarcasterButton from './components/ConnectFarcasterButton';

export default function Page() {
    const { ready, authenticated, user } = usePrivy();
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string>('@guest');
    const [isMiniApp, setIsMiniApp] = useState(false);

    useEffect(() => {
        // 👇 Farcaster MiniApp ortamını algıla
        if (typeof window !== 'undefined' && window.location !== undefined) {
            const insideMiniApp = window.location.hostname.includes('wallet.farcaster.xyz');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const farcaster = user?.farcaster;
        const wallet = user?.wallet;

        if (farcaster?.username) {
            setPlayerId(`@${farcaster.username}`);
        } else if (wallet?.address) {
            const shortWallet = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
            setPlayerId(shortWallet);
        } else {
            setPlayerId('@guest');
        }
    }, [user]);

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // ⚠️ MiniApp içindeysek direkt guest başlat
    if (isMiniApp) {
        return <SolitaireGame playerId={playerId} />;
    }

    // Normal web login akışı
    if (!ready) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Loading authentication...
            </p>
        );
    }

    if (!authenticated) {
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                <h2>Connect your Farcaster account to play 🎮</h2>
                <ConnectFarcasterButton />
            </div>
        );
    }

    return <SolitaireGame playerId={playerId} />;
}
