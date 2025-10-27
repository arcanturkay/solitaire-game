'use client';
import { useEffect } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        // 🧹 MiniApp yeniden açıldığında olası cache'i temizle
        try {
            sessionStorage.clear();
        } catch (e) {}

        // ✅ Farcaster ready çağrısı
        const callReady = () => {
            try {
                const fc = (window as any).farcaster?.miniapp?.actions;
                if (fc && typeof fc.ready === 'function') {
                    fc.ready();
                    console.log('✅ Farcaster ready() sent');
                    return true;
                }
            } catch (err) {
                console.warn('⚠️ Farcaster ready() error', err);
            }
            return false;
        };

        // 🔁 150ms aralıklarla SDK'yı bekle
        let tries = 0;
        const interval = setInterval(() => {
            tries++;
            if (callReady() || tries > 40) clearInterval(interval);
        }, 150);

        // ⏱️ 2.5sn sonra splash kapanır
        const timer = setTimeout(() => {
            callReady(); // garanti için tekrar
            onFinish();
        }, 2500);

        // 🔒 fail-safe: 6sn sonra yine kapat
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
