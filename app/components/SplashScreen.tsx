'use client';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    useEffect(() => {
        const init = async () => {
            try {
                console.log('🟢 Calling sdk.actions.ready()');
                await sdk.actions.ready();
                console.log('✅ sdk.actions.ready() success');

                // sdk.context bir Promise döner, fonksiyon değil
                const ctx = await sdk.context.catch(() => null);

                if (ctx && (ctx.user?.fid || ctx.fid)) {
                    console.log('🟣 FID:', ctx.user?.fid || ctx.fid);
                } else {
                    console.log('🔴 sdk.context missing fid');
                }

                onFinish();
            } catch (err) {
                console.warn('⚠️ sdk.actions.ready() failed', err);
                setTimeout(() => onFinish(), 1500);
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
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <img src="/splash-200.png" alt="Splash" width={120} height={120} />
            <h2>Solitaire</h2>
            <p>loading...</p>
        </div>
    );
}
