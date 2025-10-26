'use client';
import { useEffect, useState } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [farcasterUser, setFarcasterUser] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setShowSplash(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    const connectFarcaster = async () => {
        setConnecting(true);
        setErrorMessage(null);

        try {
            const sdk = (window as any)?.farcaster?.miniapp;
            if (!sdk?.context) throw new Error('Farcaster SDK not detected. Please open in Warpcast.');

            const context = await sdk.context.getUser();
            console.log('✅ Farcaster context:', context);

            if (context?.username) setFarcasterUser(context.username);
            else if (context?.fid) setFarcasterUser(`fid:${context.fid}`);
            else throw new Error('Unable to retrieve user info.');
        } catch (err: any) {
            console.error('❌ Error connecting wallet:', err);
            setErrorMessage(err.message || 'Connection failed.');
            setFarcasterUser(null);
        } finally {
            setConnecting(false);
        }
    };

    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    if (!farcasterUser) {
        return (
            <div style={{
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
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    marginBottom: '10px',
                    letterSpacing: '0.5px',
                    background: 'linear-gradient(90deg, #00baff, #0066ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Solitaire 🎮
                </h1>
                <p style={{ opacity: 0.8 }}>Connect your Farcaster Wallet to start playing.</p>

                {errorMessage && (
                    <p style={{
                        color: '#ff8f8f',
                        marginTop: '15px',
                        fontSize: '0.95rem',
                        fontWeight: 500
                    }}>
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
                    onMouseEnter={e => {
                        if (!connecting) (e.target as HTMLButtonElement).style.boxShadow = '0 0 18px rgba(0,128,255,0.7)';
                    }}
                    onMouseLeave={e => {
                        if (!connecting) (e.target as HTMLButtonElement).style.boxShadow = '0 0 10px rgba(0,128,255,0.3)';
                    }}
                >
                    {connecting
                        ? 'Connecting...'
                        : errorMessage
                            ? 'Try Again 🔁'
                            : 'Play Now ▶️'}
                </button>

                <p style={{
                    marginTop: '25px',
                    opacity: 0.6,
                    fontSize: '0.85rem',
                    lineHeight: '1.4rem'
                }}>
                    Works best inside <strong>Warpcast Mini Apps</strong><br />
                    or with your <strong>Farcaster Wallet</strong> connected.
                </p>
            </div>
        );
    }

    return <SolitaireGame playerId={farcasterUser} />;
}
