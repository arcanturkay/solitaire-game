'use client';
import { usePrivy } from '@privy-io/react-auth';

export default function ConnectFarcasterButton() {
    const { ready, authenticated, login, user } = usePrivy();

    if (!ready) {
        return (
            <button
                disabled
                style={{
                    backgroundColor: '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontWeight: 600,
                    cursor: 'not-allowed',
                }}
            >
                Loading...
            </button>
        );
    }

    if (authenticated && user?.farcaster?.username) {
        return (
            <div style={{ textAlign: 'center', color: 'white' }}>
                <p>
                    ✅ Connected as <strong>@{user.farcaster.username}</strong>
                </p>
            </div>
        );
    }

    return (
        <button
            onClick={() => login()}
            style={{
                backgroundColor: '#0A5323',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 28px',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s ease',
            }}
            onMouseOver={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#0E6C2E')}
            onMouseOut={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = '#0A5323')}
        >
            🎮 Connect Farcaster
        </button>
    );
}
