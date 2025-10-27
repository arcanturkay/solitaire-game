'use client';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';
import ConnectFarcasterButton from './components/ConnectFarcasterButton';

export default function Page() {
    const { ready, authenticated, user } = usePrivy();
    const [showSplash, setShowSplash] = useState(true);

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    if (!ready)
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Loading authentication...
            </p>
        );

    if (!authenticated)
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                <h2>Connect your Farcaster account to play 🎮</h2>
                <ConnectFarcasterButton />
            </div>
        );

    const farcasterUser = user?.farcaster;
    const wallet = user?.wallet;

    return (
        <div style={{ color: 'white', textAlign: 'center' }}>
            <h2>Welcome {farcasterUser?.username || 'Anon'}</h2>
            <p>FID: {farcasterUser?.fid}</p>
            {wallet && <p>Wallet: {wallet.address}</p>}
            <SolitaireGame playerId={farcasterUser?.username || 'guest'} />
        </div>
    );
}
