'use client';
import { usePrivy } from '@privy-io/react-auth';

export default function ConnectFarcasterButton() {
    const { ready, authenticated, user, login, logout } = usePrivy();

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
                <p>✅ Connected as <strong>@{user.farcaster.username}</strong></p>
                <button
                    onClick={() => logout()}
                    style={{
                        marginTop: 12,
                        backgroundColor: '#333',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 20px',
                        cursor: 'pointer',
                    }}
                >
                    Logout
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => login()}  // 🔥 parametresiz çağrı, v3.4.1 için doğru
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
            onMouseOver={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#0E6C2E')
            }
            onMouseOut={(e) =>
                ((e.target as HTMLButtonElement).style.backgroundColor = '#0A5323')
            }
        >
            🎮 Connect Farcaster
        </button>
    );
}
