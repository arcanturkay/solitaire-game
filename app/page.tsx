'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string>('⏳ App loading...');

    // Splash ekranı (2.5 saniye)
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    // Warpcast SDK bekleme ve ready()
    useEffect(() => {
        const waitForSDK = async () => {
            const start = Date.now();
            return new Promise<boolean>((resolve) => {
                const check = () => {
                    const hasSDK =
                        (window as any)?.farcaster?.miniapp?.actions &&
                        (window as any)?.farcaster?.miniapp?.context;
                    if (hasSDK) return resolve(true);
                    if (Date.now() - start > 4000) return resolve(false);
                    setTimeout(check, 120);
                };
                check();
            });
        };

        (async () => {
            setDebugLog('🟡 Waiting for Farcaster SDK...');
            const ok = await waitForSDK();
            if (ok) {
                try {
                    await (window as any).farcaster.miniapp.actions.ready();
                    console.log('✅ sdk.actions.ready() triggered (page.tsx)');
                    setDebugLog('🟢 Farcaster SDK ready() called');
                } catch (e) {
                    console.warn('⚠️ ready() call failed:', e);
                    setDebugLog('⚠️ SDK ready() failed');
                }
            } else {
                console.warn('⚠️ Farcaster SDK not found after timeout');
                setDebugLog('❌ Farcaster SDK not detected');
            }
        })();
    }, []);

    // Farcaster bağlantısı
    const connectFarcaster = async () => {
        setConnecting(true);
        setErrorMessage(null);
        setDebugLog('🔍 Checking SDK + fetching user...');

        try {
            // SDK’nın yüklenmesini bekle
            const ok = await new Promise<boolean>((resolve) => {
                let waited = 0;
                const iv = setInterval(() => {
                    waited += 100;
                    const sdk = (window as any)?.farcaster?.miniapp;
                    if (sdk?.context) {
                        clearInterval(iv);
                        resolve(true);
                    } else if (waited > 4000) {
                        clearInterval(iv);
                        resolve(false);
                    }
                }, 100);
            });

            if (!ok) throw new Error('Farcaster SDK not detected. Please open in Warpcast.');

            const sdk = (window as any).farcaster.miniapp;
            try { await sdk.actions.ready(); } catch {}

            const context = await sdk.context.getUser();
            console.log('✅ Farcaster context:', context);
            setDebugLog('✅ Context fetched');

            if (context?.username) setFarcasterUser(context.username);
            else if (context?.fid) setFarcasterUser(`fid:${context.fid}`);
            else throw new Error('Unable to retrieve user info.');
        } catch (err: any) {
            console.error('❌ Error connecting wallet:', err);
            setErrorMessage(err.message || 'Connection failed.');
            setFarcasterUser(null);
            setDebugLog('❌ ' + (err.message || 'Connection failed.'));
        } finally {
            setConnecting(false);
        }
    };

    // Splash gösterimi
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // Kullanıcı henüz bağlanmadıysa
    if (!farcasterUser) {
        return (
            <div
                style={{
                    background: 'radial-gradient(circle at center, #001a33 0%, #000814 100%)',
                    color: 'white',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                    padding: '20px',
                    position: 'relative'
                }}
            >
                <h1
                    style={{
                        fontSize: '2rem',
                        marginBottom: '10px',
                        letterSpacing: '0.5px',
                        background: 'linear-gradient(90deg, #00baff, #0066ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Solitaire 🎮
                </h1>
                <p style={{ opacity: 0.8 }}>Connect your Farcaster Wallet to start playing.</p>

                {errorMessage && (
                    <p
                        style={{
                            color: '#ff8f8f',
                            marginTop: '15px',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                        }}
                    >
                        ⚠️ {errorMessage}
                    </p>
                )}

                <button
                    onClick={connectFarcaster}
                    disabled={connecting}
                    style={{
                        marginTop: '25px',
                        background: connecting
                            ? 'linear-gradient(90deg, #0040aa, #0078ff)'
                            : 'linear-gradient(90deg, #0078ff, #00baff)',
                        color: 'white',
                        border: 'none',
                        padding: '14px 36px',
                        borderRadius: '12px',
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        cursor: connecting ? 'default' : 'pointer',
                        boxShadow: '0 0 10px rgba(0, 128, 255, 0.3)',
                        transition: 'all 0.25s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                        if (!connecting)
                            (e.target as HTMLButtonElement).style.boxShadow =
                                '0 0 18px rgba(0,128,255,0.7)';
                    }}
                    onMouseLeave={(e) => {
                        if (!connecting)
                            (e.target as HTMLButtonElement).style.boxShadow =
                                '0 0 10px rgba(0,128,255,0.3)';
                    }}
                >
                    {connecting
                        ? 'Connecting...'
                        : errorMessage
                            ? 'Try Again 🔁'
                            : 'Play Now ▶️'}
                </button>

                <p
                    style={{
                        marginTop: '25px',
                        opacity: 0.6,
                        fontSize: '0.85rem',
                        lineHeight: '1.4rem',
                    }}
                >
                    Works best inside <strong>Warpcast Mini Apps</strong>
                    <br />
                    or with your <strong>Farcaster Wallet</strong> connected.
                </p>

                {/* 🧭 Debug Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        fontSize: '0.75rem',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        opacity: 0.7,
                        userSelect: 'none',
                    }}
                >
                    {debugLog}
                </div>
            </div>
        );
    }

    // Kullanıcı bağlandıysa oyunu yükle
    return (
        <>
            <SolitaireGame playerId={farcasterUser} />
            {/* Debug overlay yine görünür */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '8px',
                    left: '8px',
                    fontSize: '0.75rem',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    opacity: 0.6,
                    zIndex: 999,
                    userSelect: 'none',
                }}
            >
                {debugLog}
            </div>
        </>
    );
}
