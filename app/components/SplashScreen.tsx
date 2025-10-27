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
                const ctx = await sdk.context;
                console.log('🟣 Farcaster Context:', ctx);

                const fid = ctx?.user?.fid;
                if (fid) {
                    console.log('✅ Connected FID:', fid);
                } else {
                    console.warn('⚠️ No FID found — user not connected yet');
                }

                onFinish();
            } catch (err) {
                console.error('❌ SDK init failed', err);
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
