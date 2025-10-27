'use client';
import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const [visible, setVisible] = useState(true);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs((prev) => [...prev.slice(-4), msg]);
    };

    useEffect(() => {
        let finished = false;

        const initSdk = async () => {
            if (typeof window === 'undefined' || !window.farcaster) {
                addLog('⚠️ SDK not ready yet...');
                return false;
            }
            try {
                await sdk.actions.ready();
                addLog('✅ sdk.actions.ready() success');
                return true;
            } catch (err) {
                addLog('❌ sdk.actions.ready() failed');
                return false;
            }
        };

        const start = async () => {
            let tries = 0;
            const interval = setInterval(async () => {
                tries++;
                const ok = await initSdk();
                if (ok || tries > 20) {
                    clearInterval(interval);
                    if (!finished) {
                        finished = true;
                        setVisible(false);
                        onFinish();
                    }
                }
            }, 200);

            // güvenlik süresi (5s fallback)
            setTimeout(() => {
                if (!finished) {
                    addLog('⏱️ Timeout reached, closing splash manually');
                    finished = true;
                    setVisible(false);
                    onFinish();
                }
            }, 5000);
        };

        start();
    }, [onFinish]);

    if (!visible) return null;

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                background: 'radial-gradient(circle at center, #0A5323 30%, #043011 100%)',
                color: 'white',
                fontFamily: 'sans-serif',
                transition: 'opacity 0.5s ease-in-out',
            }}
        >
            <img
                src="https://solitaire-game-chi-gules.vercel.app/splash-200.png"
                alt="Solitaire logo"
                style={{ width: 100, height: 100, marginBottom: 20 }}
            />
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600 }}>Solitaire</h2>
            <p style={{ opacity: 0.8 }}>loading...</p>

            {/* 🧩 Debug overlay */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    background: 'rgba(255,255,255,0.12)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#fff',
                    textAlign: 'right',
                }}
            >
                {logs.map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
            </div>
        </div>
    );
}
