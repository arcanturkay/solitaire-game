'use client';
import { useEffect } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        // ✅ MiniApp SDK çağrısı (CDN üzerinden)
        const tryReady = () => {
            try {
                const fc = (window as any).farcaster?.miniapp?.actions;
                if (fc && typeof fc.ready === 'function') {
                    fc.ready();
                    console.log('✅ Farcaster MiniApp: ready() sent');
                } else {
                    console.log('🌐 Farcaster SDK not available yet');
                }
            } catch (err) {
                console.log('⚠️ Farcaster SDK error:', err);
            }
        };

        // SDK’yı çalıştır ve 2.5 saniye sonra splash’ı kapat
        tryReady();
        const timer = setTimeout(() => onFinish(), 2500);
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'radial-gradient(circle at center, #0A5323 30%, #043011 100%)',
                color: 'white',
                fontFamily: 'sans-serif',
            }}
        >
            <img
                src="https://solitaire-game-chi-gules.vercel.app/splash-200.png"
                alt="Solitaire logo"
                style={{ width: 100, height: 100, marginBottom: 20 }}
            />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Solitaire</h2>
            <p style={{ opacity: 0.8 }}>loading...</p>
        </div>
    );
}
