'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    const [isMiniApp, setIsMiniApp] = useState(false);

    useEffect(() => {
        // ✅ SSR yerine client'ta render edildiğini garanti ediyoruz
        setIsClient(true);

        if (typeof window !== 'undefined') {
            const insideMiniApp = window.location.hostname.includes('wallet.farcaster.xyz');
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
