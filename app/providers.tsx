'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [isMiniApp, setIsMiniApp] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const insideMiniApp = window.location.hostname.includes('wallet.farcaster.xyz');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    // ⚠️ MiniApp içindeysek Privy'yi tamamen bypass et
    if (isMiniApp) {
        console.log('⚡ Farcaster MiniApp detected — skipping Privy Provider');
        return <>{children}</>;
    }

    // 🌍 Normal web için Privy aktif
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#0A5323',
                },
                loginMethods: ['farcaster', 'wallet'],
            }}
        >
            {children}
        </PrivyProvider>
    );
}
