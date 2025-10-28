'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';
import '../styles/solitaire.css';

export default function Page() {
    const [fid, setFid] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            await sdk.actions.ready(); // mini app hazırlanıyor
            const context = await sdk.context; // 👈 async context çağrısı
            const fidValue = context?.user?.fid;
            if (fidValue) setFid(fidValue.toString());
            setIsReady(true);
        };
        init();
    }, []);

    const handleConnect = async () => {
        // Farcaster dışı testlerde fallback
        const context = await sdk.context;
        const fidValue = context?.user?.fid || 'guest';
        setFid(fidValue.toString());
    };

    if (!isReady) {
        return (
            <div id="farcaster-wall">
                <h2>Loading Mini App...</h2>
            </div>
        );
    }

    if (!fid) return <SplashScreen onConnect={handleConnect} />;
    return <SolitaireGame playerId={`fid${fid}`} />;
}
