'use client';
import { sdk } from '@farcaster/miniapp-sdk';
import { useState } from 'react';

export default function ConnectFarcasterButton() {
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async () => {
        try {
            setConnecting(true);
            console.log('🟣 Requesting Farcaster connection...');
            // Kullanıcıyı Farcaster uygulamasına yönlendir
            await sdk.actions.openUrl('https://warpcast.com');
            console.log('✅ Connection flow triggered');
        } catch (err) {
            console.error('❌ Failed to trigger Farcaster connection:', err);
        } finally {
            setConnecting(false);
        }
    };

    return (
        <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
                backgroundColor: connecting ? '#444' : '#0A5323',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 28px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: connecting ? 'not-allowed' : 'pointer',
                transition: 'background 0.3s ease',
            }}
            onMouseOver={(e) => {
                if (!connecting)
                    (e.target as HTMLButtonElement).style.backgroundColor = '#0E6C2E';
            }}
            onMouseOut={(e) => {
                if (!connecting)
                    (e.target as HTMLButtonElement).style.backgroundColor = '#0A5323';
            }}
        >
            {connecting ? 'Connecting...' : '🎮 Connect Farcaster'}
        </button>
    );
}
