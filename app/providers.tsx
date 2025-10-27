'use client';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    const [isMiniApp, setIsMiniApp] = useState(false);

    useEffect(() => {
        // Yalnızca client tarafında çalıştır
        setIsClient(true);

        if (typeof window !== 'undefined') {
            const insideMiniApp =
                window.location.hostname.includes('wallet.farcaster.xyz') ||
                window.location.hostname.includes('farcaster.xyz') ||
                window.location.hostname.includes('warpcast.com');
            setIsMiniApp(insideMiniApp);
        }
    }, []);

    // SSR veya MiniApp ortamında direkt çocukları render et
    if (process.env.NODE_ENV === 'development') {
        console.log('⚡ Rendering without Privy (SSR or MiniApp mode)');
    }

    // Normal tarayıcı ortamında da sadece children render edilir
    return <>{children}</>;
}
