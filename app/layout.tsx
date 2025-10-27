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
                url: '/embed-1200x800.png',
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
            {/* ✅ Meta etiketleri */}
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            {/* 🎯 Farcaster Mini App manifest */}
            <meta
                name="fc:miniapp"
                content={`{
            "version": "1",
            "imageUrl": "https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png",
            "alwaysShowSplash": false,
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

            {/* ✅ Farcaster SDK (stabil CDN) */}
            <script
                src="https://cdn.jsdelivr.net/npm/@farcaster/mini-apps-sdk@0.2.2/dist/browser.js"
                defer
            ></script>

            {/* ✅ Miniapp ready script — public klasörden çağrılır */}
            <script src="/farcaster-ready.js" defer></script>
        </head>

        <body>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
