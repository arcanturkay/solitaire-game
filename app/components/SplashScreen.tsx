'use client';
import { useEffect } from 'react';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (typeof onFinish === 'function') onFinish();
        }, 2500);
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
                width: '100vw',
                background: 'radial-gradient(circle at center, #0A5323 30%, #043011 100%)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                transition: 'opacity 0.5s ease',
            }}
        >
            <img
                src="https://solitaire-game-chi-gules.vercel.app/splash-200.png"
                alt="Solitaire logo"
                style={{
                    width: 100,
                    height: 100,
                    marginBottom: 20,
                    filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))'
                }}
            />
            <h2 style={{fontSize: '1.8rem', fontWeight: '600', margin: 0}}>Solitaire</h2>
            <p style={{opacity: 0.85, fontSize: '1.1rem', marginTop: 8}}>Loading...</p>
        </div>
    );
}
