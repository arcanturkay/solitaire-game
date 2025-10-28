export const metadata = {
    title: 'Solitaire Mini App',
    description: 'Play Solitaire directly inside Warpcast',
    other: {
        'fc:miniapp': JSON.stringify({
            version: '1',
            imageUrl: 'https://solitaire-frame.vercel.app/preview.png',
            button: {
                title: 'Play Solitaire',
                action: {
                    type: 'launch_frame',
                    name: 'Solitaire',
                    url: 'https://solitaire-frame.vercel.app/',
                    splashImageUrl: 'https://solitaire-frame.vercel.app/splash.png',
                    splashBackgroundColor: '#0A5323'
                }
            }
        })
    }
};
export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>{children}</body>
        </html>
    );
}