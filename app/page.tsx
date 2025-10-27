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
    const [walletConnected, setWalletConnected] = useState(false);

    // 🧩 MiniApp ortamını algıla
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const insideMiniApp =
                window.location.hostname.includes('wallet.farcaster.xyz') ||
                window.location.hostname.includes('farcaster.xyz') ||
                window.location.hostname.includes('warpcast.com');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    // 👤 Kullanıcı bilgisi
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

        setWalletConnected(!!wallet?.address);
    }, [user]);

    // 🎬 Splash ekranı
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // ⚙️ MiniApp ortamı — wallet bağlıysa oyunu başlat
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

    // 🌐 Web ortamı — Privy login akışı
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
