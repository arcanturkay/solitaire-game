import './globals.css';
import Providers from './providers';

export const metadata = {
    title: 'Solitaire Game',
    description: 'Play Solitaire directly inside Farcaster 🎮',
    openGraph: {
        title: 'Solitaire Game',
        description: 'Play Solitaire directly inside Farcaster 🎮',
        images: [
            {
                url: 'https://solitaire-game-chi-gules.vercel.app',
                width: 1200,
                height: 800,
                alt: 'Solitaire Game',
            },
        ],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <script type="module" src="/farcaster-ready.js"></script>
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate"/>
            <meta httpEquiv="Pragma" content="no-cache"/>
            <meta httpEquiv="Expires" content="0"/>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <meta
                name="fc:miniapp"
                content={`{
            "version": "1",
            "imageUrl": "https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png",
            "button": {
              "title": "Play Solitaire 🎮",
              "action": {
                "type": "launch_frame",
                "name": "Solitaire Game",
                "url": "https://solitaire-game-chi-gules.vercel.app",
                "splashImageUrl": "https://solitaire-game-chi-gules.vercel.app/splash-200.png",
                "splashBackgroundColor": "#08401B"
              }
            }
          }`}
            />
        </head>
        <body>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
