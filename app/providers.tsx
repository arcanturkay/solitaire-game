'use client';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { ReactNode, useEffect } from 'react';

function UserWatcher() {
    const { user } = usePrivy();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (user?.farcaster) {
            const cached = {
                fid: user.farcaster.fid,
                username: user.farcaster.username ?? '',
            };
            localStorage.setItem('farcasterUserCache', JSON.stringify(cached));
            console.debug('✅ Farcaster user cached:', cached);
        } else {
            localStorage.removeItem('farcasterUserCache');
        }
    }, [user]);

    return null;
}

export default function Providers({ children }: { children: ReactNode }) {
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
            <UserWatcher />
            {children}
        </PrivyProvider>
    );
}
