'use client';

interface FarcasterLoginProps {
    onLogin: (playerId: string) => void;
}

export default function FarcasterLogin({ onLogin }: FarcasterLoginProps) {
    const handleLogin = () => {
        // local test için Farcaster doğrulaması olmadan direkt guest girişi
        onLogin('@guest');
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#052C13',
                color: 'white',
            }}
        >
            <img
                src="/farcaster-icon.svg"
                alt="Farcaster"
                style={{ width: 64, height: 64, marginBottom: 20 }}
            />
            <h3>Connect to Farcaster</h3>
            <button
                onClick={handleLogin}
                style={{
                    marginTop: 20,
                    padding: '12px 24px',
                    fontSize: '1rem',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1DB954',
                    color: 'white',
                    cursor: 'pointer',
                }}
            >
                Connect with Farcaster Wallet
            </button>
        </div>
    );
}
