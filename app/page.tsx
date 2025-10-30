'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import SplashScreen from './components/SplashScreen';
import SolitaireGame from './components/SolitaireGame';
import '../styles/solitaire.css';

export default function Page() {
    const [fid, setFid] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                await sdk.actions.ready();
                const context = await sdk.context;

                if (context?.user) {
                    const { fid, username, displayName } = context.user;
                    setFid(fid?.toString());
                    setUsername(username || displayName || `fid${fid}`);
                }

                // Farcaster SDK'dan wallet (Ethereum) provider al
                try {
                    const ethProvider = await sdk.wallet.getEthereumProvider();
                    if (ethProvider && ethProvider.selectedAddress) {
                        setWalletAddress(ethProvider.selectedAddress);
                    }
                } catch {
                    console.warn('wallet address not accessible yet');
                }

                setIsReady(true);
            } catch (err) {
                console.error('SDK init failed', err);
                setIsReady(true);
            }
        };
        init();
    }, []);

    const handleConnect = async () => {
        const context = await sdk.context;
        const { fid, username, displayName } = context?.user || {};
        setFid(fid?.toString() || 'guest');
        setUsername(username || displayName || `fid${fid || 'guest'}`);

        try {
            const ethProvider = await sdk.wallet.getEthereumProvider();
            if (ethProvider && ethProvider.selectedAddress) {
                setWalletAddress(ethProvider.selectedAddress);
            }
        } catch (e) {
            console.warn('no wallet provider', e);
        }
    };

    if (!isReady) {
        return (
            <div id="farcaster-wall">
                <h2>Loading Mini App...</h2>
            </div>
        );
    }

    if (!fid) return <SplashScreen onConnect={handleConnect} />;

    return (
        <SolitaireGame
            playerId={username || `fid${fid}`}
            playerAddress={walletAddress || '0x0000000000000000000000000000000000000000'}
            displayName={username || `fid${fid}`}
        />
    );
}
