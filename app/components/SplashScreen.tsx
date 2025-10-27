'use client';
import { useEffect } from 'react';

interface SplashScreenProps {
    onFinish: () => void;
}

// 🧩 SDK Manuel Loader
const loadFarcasterSDK = async () => {
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (w.farcaster?.miniapp?.actions) return; // zaten yüklü

    return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.farcaster.xyz/mini-apps-sdk@0.2.2/dist/browser.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ Farcaster MiniApp SDK loaded');
            resolve();
        };
        script.onerror = () => {
            console.error('❌ Failed to load Farcaster SDK');
            reject();
        };
        document.head.appendChild(script);
    });
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    useEffect(() => {
        let closed = false;

        const callReady = () => {
            try {
                const fc = (window as any).farcaster?.miniapp?.actions;
                if (fc && typeof fc.ready === 'function') {
                    fc.ready();
                    console.log('✅ Farcaster ready() called');
                    return true;
                }
            } catch (e) {
                console.warn('⚠️ ready() error', e);
            }
            return false;
        };

        const start = async () => {
            await loadFarcasterSDK();
            let tries = 0;
            const iv = setInterval(() => {
                tries++;
                if (callReady() || tries > 40) clearInterval(iv);
            }, 150);

            // 2.5s sonra kapanır
            const timer = setTimeout(() => {
                if (!closed) {
                    callReady();
                    onFinish();
                    closed = true;
                }
            }, 2500);

            // Fail-safe: 6s sonra yine kapat
            const force = setTimeout(() => {
                if (!closed) {
                    onFinish();
                    closed = true;
                }
            }, 6000);

            return () => {
                clearInterval(iv);
                clearTimeout(timer);
                clearTimeout(force);
            };
        };

        start();
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
                transition: 'opacity 0.6s ease-in-out',
            }}
        >
            <img
                src="https://solitaire-game-chi-gules.vercel.app/splash-200.png"
                alt="Splash"
                style={{ width: 100, height: 100, marginBottom: 20 }}
            />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Solitaire</h2>
            <p style={{ opacity: 0.8 }}>loading...</p>
        </div>
    );
}
