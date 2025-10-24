'use client';
import { useEffect } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onFinish(), 2500); // 2.5 saniye sonra oyuna geç
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
                transition: 'opacity 0.5s ease',
            }}
        >
            <img
                src="/splash-200.png"
                alt="Solitaire logo"
                style={{ width: 100, height: 100, marginBottom: 20 }}
            />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '600' }}>Solitaire</h2>
            <p style={{ opacity: 0.8 }}>loading...</p>
        </div>
    );
}
