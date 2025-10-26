'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [debug, setDebug] = useState('⏳ Initializing...');

    // Splash
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    // 🔹 SDK bekleme ve otomatik bağlanma
    useEffect(() => {
        const initFarcaster = async () => {
            setDebug('🕐 Checking for SDK...');
            const start = Date.now();
            let sdk: any = null;

            // 6 saniyeye kadar dene
            while (Date.now() - start < 6000) {
                const candidate = (window as any)?.farcaster?.miniapp;
                if (candidate?.actions?.ready) {
                    sdk = candidate;
                    break;
                }
                await new Promise((r) => setTimeout(r, 200));
            }

            if (!sdk) {
                // SDK hiç bulunmadı
                setDebug('⚠️ SDK not found, running in mock mode');
                setFarcasterUser('preview_user');
                return;
            }

            try {
                await sdk.actions.ready();
                setDebug('✅ SDK ready, fetching context...');
                const ctx = await sdk.context.getUser?.();
                console.log('📦 Farcaster context:', ctx);
                if (ctx?.username) setFarcasterUser(ctx.username);
                else if (ctx?.fid) setFarcasterUser(`fid:${ctx.fid}`);
                else setFarcasterUser('anonymous');
                setDebug('✅ User connected');
            } catch (err) {
                console.error('❌ SDK error:', err);
                setDebug('❌ SDK ready but context fetch failed');
                setFarcasterUser('anonymous');
            }
        };

        // 2 sn sonra denemeye başla
        const timer = setTimeout(initFarcaster, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Splash gösterimi
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // Eğer henüz bağlanmadıysa
    if (!farcasterUser) {
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
                <h2>Solitaire 🎮</h2>
                <p style={{ opacity: 0.8 }}>Checking Farcaster connection...</p>
                <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 10 }}>{debug}</div>
            </div>
        );
    }

    // ✅ Kullanıcı bulundu, oyunu başlat
    return (
        <>
            <SolitaireGame playerId={farcasterUser} />
            <div
                style={{
                    position: 'fixed',
                    bottom: '8px',
                    left: '8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    opacity: 0.6,
                    zIndex: 999,
                }}
            >
                {debug}
            </div>
        </>
    );
}
