'use client';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

declare global {
    interface Window {
        farcaster?: any;
    }
}

export default function SplashScreen({ onFinish }: { onFinish: (playerId: string) => void }) {
    useEffect(() => {
        const init = async () => {
            try {
                console.log('🟢 Initializing Farcaster MiniApp...');
                await sdk.actions.ready();
                console.log('✅ sdk.actions.ready() success');

                // context doğrudan Promise döndürüyor (fonksiyon değil!)
                let ctx = await sdk.context;
                console.log('🟣 Farcaster Context:', ctx);

                const isMiniApp =
                    window?.location?.hostname?.includes('wallet.farcaster.xyz') ||
                    window?.location?.hostname?.includes('farcaster.xyz') ||
                    window?.location?.hostname?.includes('warpcast.com');

                if (!isMiniApp) {
                    console.warn('⚪ Not inside Farcaster MiniApp — user context unavailable');
                    onFinish('@web');
                    return;
                }

                // Kullanıcı bağlı değilse wallet bağlantısı iste
                if (!ctx?.user?.fid) {
                    console.warn('⚠️ No FID found — requesting wallet connection...');
                    try {
                        // @ts-ignore  → SDK tiplerinde tanımlı değil ama runtime’da mevcut
                        await sdk.actions.requestWalletConnection();
                    } catch (e) {
                        console.warn('⚠️ Wallet connection cancelled or failed:', e);
                    }

                    // tekrar Promise olarak oku
                    ctx = await sdk.context;
                }

                let playerId = '@unknown';
                if (ctx?.user?.username) {
                    playerId = `@${ctx.user.username}`;
                } else if (ctx?.user?.fid) {
                    playerId = `FID-${ctx.user.fid}`;
                }

                console.log('✅ Player identified as:', playerId);
                onFinish(playerId);
            } catch (err) {
                console.error('❌ SDK init failed', err);
                setTimeout(() => onFinish('@error'), 2000);
            }
        };

        init();
    }, [onFinish]);

    return (
        <div
            style={{
                backgroundColor: '#08401B',
                color: 'white',
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <img
                src="https://solitaire-frame.vercel.app/splash.png"
                alt="Splash"
                width={140}
                height={140}
                loading="eager"
                style={{ marginBottom: '20px' }}
            />
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Solitaire</h2>
            <p style={{ marginTop: '8px', fontSize: '1rem' }}>loading...</p>
        </div>
    );
}
