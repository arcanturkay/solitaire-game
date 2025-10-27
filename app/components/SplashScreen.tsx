'use client';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

declare global {
    interface Window {
        farcaster?: any;
    }
}

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    useEffect(() => {
        const init = async () => {
            try {
                console.log('🟢 Calling sdk.actions.ready()...');
                await sdk.actions.ready();
                console.log('✅ sdk.actions.ready() success');

                // Farcaster context çek
                const ctx = await sdk.context();
                console.log('🟣 Farcaster Context:', ctx);

                if (ctx?.user?.fid || ctx?.fid) {
                    console.log('✅ Connected FID:', ctx.user?.fid || ctx.fid);
                    onFinish();
                    return;
                }

                // Eğer kullanıcı kimliği yoksa authenticate tetikle
                console.warn('⚠️ No FID found — triggering authentication...');
                await sdk.actions.authenticate();
                const newCtx = await sdk.context();
                if (newCtx?.user?.fid || newCtx?.fid) {
                    console.log('✅ Authenticated FID:', newCtx.user?.fid || newCtx.fid);
                } else {
                    console.warn('⚠️ Authentication did not return FID');
                }
                onFinish();
            } catch (err) {
                console.error('❌ SDK init failed', err);
                // fallback — 2 saniye sonra splash kapat
                setTimeout(() => onFinish(), 2000);
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
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <img
                src="/splash.png"
                alt="Splash"
                width={120}
                height={120}
                loading="eager"
                style={{ marginBottom: '20px' }}
                onError={() => console.warn('⚠️ Splash image not found — check /public/splash-200.png')}
            />
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Solitaire</h2>
            <p style={{ marginTop: '8px', fontSize: '1rem' }}>loading...</p>
        </div>
    );
}
