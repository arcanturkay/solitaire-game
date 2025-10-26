'use client';
import { useEffect, useState } from 'react';

export default function FarcasterDebug() {
    const [isFarcaster, setIsFarcaster] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [wallet, setWallet] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    function log(msg: string) {
        setLogs((prev) => [...prev, msg]);
        console.log(msg);
    }

    useEffect(() => {
        async function check() {
            const fc = (window as any)?.farcaster?.miniapp;
            if (fc) {
                setIsFarcaster(true);
                log('✅ Farcaster SDK detected');
            } else {
                log('❌ Farcaster SDK not found (running on web/preview)');
                return;
            }

            // Kullanıcı bilgisi
            if (fc.context?.getUser) {
                const u = await fc.context.getUser().catch(() => null);
                if (u) {
                    log(`👤 User detected: ${u.username || 'unknown'} (fid: ${u.fid})`);
                    setUser(u);
                } else log('⚠️ getUser() returned null');
            }

            // Wallet isteği
            if (fc.actions?.requestWallet) {
                const w = await fc.actions.requestWallet().catch(() => null);
                if (w?.address) {
                    log(`💰 Wallet connected: ${w.address}`);
                    setWallet(w);
                } else log('⚠️ Wallet connection rejected or unavailable');
            }
        }

        check();
    }, []);

    return (
        <div
            style={{
                background: '#0A5323',
                color: 'white',
                fontFamily: 'monospace',
                padding: 12,
                borderRadius: 8,
                margin: '20px auto',
                maxWidth: 500,
                fontSize: '0.85rem',
            }}
        >
            <h3>🧩 Farcaster Debug</h3>
            <p>
                <strong>Mode:</strong> {isFarcaster ? 'Farcaster MiniApp ✅' : 'Web / Preview 🌐'}
            </p>
            {user && (
                <p>
                    <strong>User:</strong> {user.username} (fid: {user.fid})
                </p>
            )}
            {wallet && (
                <p>
                    <strong>Wallet:</strong> {wallet.address}
                </p>
            )}
            <hr />
            <div style={{ textAlign: 'left' }}>
                {logs.map((l, i) => (
                    <div key={i}>• {l}</div>
                ))}
            </div>
        </div>
    );
}
