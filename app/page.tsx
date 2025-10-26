'use client';

import { useEffect, useState } from 'react';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFarcasterContext() {
            try {
                const sdk = (window as any)?.farcaster?.miniapp;
                if (!sdk || !sdk.context) {
                    console.warn('⚠️ Farcaster SDK not detected — falling back to guest mode');
                    setFarcasterUser('@guest');
                    setLoading(false);
                    return;
                }

                const context = await sdk.context.getUser();
                console.log('👤 Farcaster context:', context);

                if (context?.username) setFarcasterUser(context.username);
                else if (context?.fid) setFarcasterUser(`fid:${context.fid}`);
                else setFarcasterUser('@guest');
            } catch (err) {
                console.error('❌ Failed to get Farcaster user:', err);
                setFarcasterUser('@guest');
            } finally {
                setLoading(false);
            }
        }

        // SDK'nın yüklenmesi için 2.5s bekle
        const timer = setTimeout(fetchFarcasterContext, 2500);
        return () => clearTimeout(timer);
    }, []);

    // 🟩 Splash / Loading ekranı
    if (loading) {
        return (
            <div
                style={{
                    background: '#08401B',
                    color: 'white',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                }}
            >
                <img
                    src="/splash-200.png"
                    alt="Solitaire splash"
                    style={{ width: 100, height: 100, marginBottom: 20 }}
                />
                <h2 style={{ fontSize: '1.6rem' }}>Solitaire</h2>
                <p>Loading...</p>
            </div>
        );
    }

    // 🚫 Warpcast dışında açılırsa uyarı
    if (!farcasterUser || farcasterUser === '@guest') {
        return (
            <div
                style={{
                    background: '#043011',
                    color: 'white',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                    padding: '20px',
                }}
            >
                <h2>⚠️ Please open inside Warpcast</h2>
                <p>This mini app only works with Farcaster SDK context.</p>
            </div>
        );
    }

    // ✅ Farcaster kimliği başarıyla alındıysa
    return (
        <div>
            <SolitaireGame playerId={farcasterUser} />
        </div>
    );
}
