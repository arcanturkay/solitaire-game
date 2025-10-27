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

    // 🧩 Kimlik çözümleme her zaman tanımlı olmalı (KOŞULSUZ)
    useEffect(() => {
        if (!user) return;

        const farcaster = user?.farcaster;
        const wallet = user?.wallet;

        if (farcaster?.username) {
            setPlayerId(`@${farcaster.username}`);
            console.log('✅ Farcaster user detected:', farcaster.username);
        } else if (wallet?.address) {
            const shortWallet = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
            setPlayerId(shortWallet);
            console.log('✅ Wallet-only user detected:', shortWallet);
        } else {
            setPlayerId('@guest');
        }
    }, [user]);

    // 🎬 Splash ekranı
    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    // ⏳ Privy SDK yüklenmemiş
    if (!ready) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Loading authentication...
            </p>
        );
    }

    // 🔐 Kullanıcı giriş yapmamış
    if (!authenticated) {
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                <h2>Connect your Farcaster account to play 🎮</h2>
                <ConnectFarcasterButton />
            </div>
        );
    }

    // 🎮 Oyun
    return <SolitaireGame playerId={playerId} />;
}
