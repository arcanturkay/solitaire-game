'use client';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [walletAddr, setWalletAddr] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // ✅ Splash kapanma fix (yeşil ekran engelleme)
    useEffect(() => {
        try {
            if (!(window as any).farcaster) {
                // mock SDK for web/local preview
                (window as any).farcaster = {
                    miniapp: {
                        actions: {
                            ready: () => console.log('🧩 Fake Farcaster SDK ready() (localhost mode)'),
                        },
                    },
                };
            }

            const fc = (window as any).farcaster.miniapp.actions;
            if (fc && typeof fc.ready === 'function') {
                fc.ready();
                console.log('✅ Farcaster SDK ready() called (real or mock)');
            }
        } catch (e) {
            console.warn('⚠️ Farcaster ready() call failed:', e);
        }
    }, []);

    // ✅ Kullanıcı ve wallet bağlantısı
    useEffect(() => {
        if (showSplash) return;

        async function connectFarcaster() {
            try {
                console.log('🟣 Checking for Farcaster SDK...');

                // SDK hazır olana kadar max 2sn bekle
                await new Promise<void>((resolve) => {
                    let elapsed = 0;
                    const interval = setInterval(() => {
                        const fcReady = (window as any)?.farcaster?.miniapp?.actions?.ready;
                        elapsed += 150;
                        if (fcReady || elapsed >= 2000) {
                            clearInterval(interval);
                            resolve();
                        }
                    }, 150);
                });

                const fc = (window as any)?.farcaster?.miniapp;
                let user: any = null;
                let wallet: any = null;

                // 1️⃣ Kullanıcı kimliği
                if (fc?.context?.getUser) {
                    console.log('✅ Detected Farcaster MiniApp SDK (modern)');
                    user = await fc.context.getUser().catch((err: any) => {
                        console.warn('context.getUser() failed:', err);
                        return null;
                    });
                }

                // Legacy fallback
                if (!user && (window as any)?.farcaster?.user) {
                    console.log('⚙️ Using legacy Farcaster SDK (window.farcaster.user)');
                    user = (window as any).farcaster.user;
                }

                console.log('📦 Farcaster user object:', user);

                // 2️⃣ Wallet bağlantısı (kullanıcı izni ister)
                if (fc?.actions?.requestWallet) {
                    try {
                        wallet = await fc.actions.requestWallet().catch(() => null);
                        if (wallet?.address) {
                            console.log('🔗 Connected wallet:', wallet);
                            setWalletAddr(wallet.address);
                        } else {
                            console.log('⚠️ Wallet connection rejected or unavailable.');
                        }
                    } catch (e) {
                        console.warn('⚠️ requestWallet() failed:', e);
                    }
                }

                // 3️⃣ Player ID oluştur
                if (user?.fid) {
                    const username =
                        user.username || (user.displayName ? user.displayName.replace(/\s+/g, '') : null);
                    const id = username ? `@${username}` : `fid:${user.fid}`;
                    console.log('✅ Connected as:', id);
                    setPlayerId(id);
                } else {
                    console.log('🟡 No Farcaster user detected → using @guest');
                    setPlayerId('@guest');
                }
            } catch (err) {
                console.error('❌ Farcaster user fetch failed:', err);
                setError('Unable to connect to Farcaster.');
                setPlayerId('@guest');
            }
        }

        connectFarcaster();
    }, [showSplash]);

    // ⏳ Splash
    if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

    // 🧱 Error wall
    if (error) {
        return (
            <div id="farcaster-wall">
                <h2>⚠️ Connection Error</h2>
                <p>{error}</p>
                <p>Please open this game inside the Farcaster client.</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 8,
                        background: '#1D4ED8',
                        color: 'white',
                        border: 'none',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ⌛ Connecting text
    if (!playerId) {
        return (
            <p style={{ color: 'white', textAlign: 'center', marginTop: '40vh' }}>
                Connecting to Farcaster...
            </p>
        );
    }

    // 🎮 Start game + küçük debug info
    return (
        <div style={{ textAlign: 'center', color: 'white' }}>
            <SolitaireGame playerId={playerId} />
            <div style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.8 }}>
                Player: {playerId}
                {walletAddr && (
                    <div>
                        Wallet: {walletAddr.slice(0, 6)}...{walletAddr.slice(-4)}
                    </div>
                )}
            </div>
        </div>
    );
}
