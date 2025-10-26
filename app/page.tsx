'use client';

import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen'; // yolun doğru olduğundan emin ol
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [loadingCtx, setLoadingCtx] = useState(true);

    useEffect(() => {
        // Splash bittikten sonra Farcaster context’i çek
        if (!showSplash) {
            const fetchCtx = async () => {
                const sdk = (window as any)?.farcaster?.miniapp;
                if (!sdk?.context) {
                    setLoadingCtx(false);
                    return;
                }
                try {
                    const ctx = await sdk.context.getUser();
                    if (ctx?.username) setFarcasterUser(ctx.username);
                    else if (ctx?.fid) setFarcasterUser(`fid:${ctx.fid}`);
                    else setFarcasterUser(null);
                } catch {
                    setFarcasterUser(null);
                } finally {
                    setLoadingCtx(false);
                }
            };
            fetchCtx();
        }
    }, [showSplash]);

    // 1) Splash göster
    if (showSplash) {
        return <SplashScreen onFinish={() => setShowSplash(false)} key="splash" />;
    }

    // 2) Splash sonrası Farcaster context’i yükleniyorsa
    if (loadingCtx) {
        return (
            <div style={{
                background:'#043011',color:'white',height:'100vh',display:'flex',
                flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'
            }}>
                <p>Loading Farcaster...</p>
            </div>
        );
    }

    // 3) Farcaster yoksa (Warpcast dışında açılmışsa)
    if (!farcasterUser) {
        return (
            <div style={{
                background:'#043011',color:'white',height:'100vh',display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',fontFamily:'sans-serif',textAlign:'center',padding:'20px'
            }}>
                <h2>⚠️ Please open in Farcaster</h2>
                <p>This game only works inside Warpcast.</p>
            </div>
        );
    }

    // 4) Oyun
    return <SolitaireGame playerId={farcasterUser} />;
}
