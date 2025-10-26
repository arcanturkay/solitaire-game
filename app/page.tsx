'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<string>('⏳ Initializing...');

    // --- Splash Screen ---
    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    // --- Wait for Farcaster SDK + Call ready() ---
    useEffect(() => {
        const waitForSDK = async () => {
            const start = Date.now();
            return new Promise<boolean>((resolve) => {
                const check = () => {
                    const fc = (window as any)?.farcaster;
                    if (fc && fc.miniapp) return resolve(true);
                    if (Date.now() - start > 6000) return resolve(false);
                    setTimeout(check, 150);
                };
                check();
            });
        };

        (async () => {
            setDebugLog('🟡 Waiting for Farcaster SDK...');
            const ok = await waitForSDK();

            if (ok) {
                try {
                    await (window as any).farcaster.miniapp.actions.ready?.();
                    console.log('✅ Farcaster SDK ready() called');
                    setDebugLog('🟢 Farcaster SDK ready()');
                } catch (e) {
                    console.warn('⚠️ ready() failed:', e);
                    setDebugLog('⚠️ ready() failed');
                }
            } else {
                console.warn('❌ Farcaster SDK not found after timeout');
                setDebugLog('❌ Farcaster SDK not detected (check launch method)');
            }
        })();
    }, []);

    // --- Connect to Farcaster ---
    const connectFarcaster = async () => {
        setConnecting(true);
        setErrorMessage(null);
        setDebugLog('🔍 Trying to connect...');

        try {
            const ok = await new Promise<boolean>((resolve) => {
                let waited = 0;
                const iv = setInterval(() => {
                    waited += 150;
                    const fc = (window as any)?.farcaster;
                    if (fc && fc.miniapp?.context) {
                        clearInterval(iv);
                        resolve(true);
                    } else if (waited > 6000) {
                        clearInterval(iv);
                        resolve(false);
                    }
                }, 150);
            });

            if (!ok) throw new Error('Farcaster SDK not detected. Please open via “Open Mini App” in Warpcast.');

            const sdk = (window as any).farcaster.miniapp;
            try { await sdk.actions.ready?.(); } catch {}

            // Retry for context (bazı cihazlarda geç geliyor)
            let context: any;
            for (let i = 0; i < 10; i++) {
                try {
                    context = await sdk.context.getUser?.();
                    if (context) break;
                } catch {}
                await new Promise(r => setTimeout(r, 200));
            }

            if (!context) throw new Error('Could not fetch Farcaster user. Try again.');

            console.log('✅ Farcaster context:', context);
            setDebugLog('✅ Context fetched');

            if (context.username) setFarcasterUser(context.username);
            else if (context.fid) setFarcasterUser(`fid:${context.fid}`);
            else throw new Error('User info missing in context.');
        } catch (err: any) {
            console.error('❌ Connection error:', err);
            setErrorMessage(err.message || 'Connection failed.');
            setDebugLog('❌ ' + (err.message || 'Connection failed.'));
            setFarcasterUser(null);
        } finally {
            setConnecting(false);
        }
    };

    // --- Splash ---
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // --- No user yet ---
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

                {/* Debug Badge */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        fontSize: '0.75rem',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        opacity: 0.8,
                        userSelect: 'none',
                    }}
                >
                    {(typeof window !== 'undefined' && (window as any).farcaster)
                        ? `🟢 Farcaster Detected | ${debugLog}`
                        : `🔴 No Farcaster SDK | ${debugLog}`}
                </div>
            </div>
        );
    }

    // --- User connected -> load game ---
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
                    userSelect: 'none',
                }}
            >
                {debugLog}
            </div>
        </>
    );
}
