'use client';
import { useEffect } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        // 🔁 Farcaster SDK ready() tetikleme
        const callReady = () => {
            try {
                const fc = (window as any).farcaster?.miniapp?.actions;
                if (fc && typeof fc.ready === 'function') {
                    fc.ready();
                    console.log('✅ Farcaster MiniApp: ready() sent');
                    return true;
                }
            } catch (err) {
                console.warn('⚠️ Farcaster SDK not yet available:', err);
            }
            return false;
        };

        // 🚀 İlk deneme hemen
        callReady();

        // 🕐 Aralıkla yeniden dene (her 150ms, toplam 3 saniye)
        let tries = 0;
        const interval = setInterval(() => {
            tries++;
            if (callReady() || tries > 20) clearInterval(interval);
        }, 150);

        // 🧩 2.5 saniye sonra splash’ı kapat
        const timer = setTimeout(() => {
            callReady(); // güvenlik için bir kez daha
            onFinish();
        }, 2500);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
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
                fontFamily: 'Inter, sans-serif',
                transition: 'opacity 0.4s ease',
            }}
        >
            <img
                src="https://solitaire-game-chi-gules.vercel.app/splash-200.png"
                alt="Solitaire logo"
                style={{
                    width: 100,
                    height: 100,
                    marginBottom: 20,
                    borderRadius: '20%',
                    boxShadow: '0 0 25px rgba(255,255,255,0.2)',
                }}
            />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Solitaire</h2>
            <p style={{ opacity: 0.8, marginTop: 8 }}>loading...</p>
        </div>
    );
}
