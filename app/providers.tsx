'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    const [isMiniApp, setIsMiniApp] = useState(false); // ✅ Eksik state eklendi

    useEffect(() => {
        // ✅ Sadece client tarafında çalıştır
        setIsClient(true);

        if (typeof window !== 'undefined') {
            const insideMiniApp =
                window.location.hostname.includes('wallet.farcaster.xyz') ||
                window.location.hostname.includes('farcaster.xyz') ||
                window.location.hostname.includes('warpcast.com');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    // ⛔ SSR veya MiniApp ortamında Privy tamamen bypass edilir
    if (!isClient || isMiniApp) {
        console.log('⚡ Skipping Privy Provider (SSR or MiniApp mode)');
        return <>{children}</>;
    }

    // ✅ Normal tarayıcı ortamında Privy aktif
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmh942lob00d3l80cnoqq89og';

    return (
        <PrivyProvider
            appId={appId}
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
