'use client';
import { useEffect } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        const callReady = () => {
            try {
                const fc = (window as any).farcaster?.miniapp?.actions;
                if (fc && typeof fc.ready === 'function') {
                    fc.ready();
                    console.log('✅ Farcaster ready() sent');
                    return true;
                }
            } catch {}
            return false;
        };

        // İlk deneme + interval
        let tries = 0;
        const interval = setInterval(() => {
            tries++;
            if (callReady() || tries > 40) clearInterval(interval); // 6sn boyunca dener
        }, 150);

        // Splash 2.5sn sonra kapanır
        const timer = setTimeout(() => {
            callReady(); // garanti için
            onFinish();
        }, 2500);

        // Fail-safe: 6sn sonunda yine zorla kapat
        const forceClose = setTimeout(() => onFinish(), 6000);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
            clearTimeout(forceClose);
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
