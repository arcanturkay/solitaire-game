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
                // ⚠️ fazladan tırnaklar kaldırıldı
                url: 'https://solitaire-frame.vercel.app/embed-1200x800.png',
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
            {/* ✅ preload sadece environment flag set eder */}
            <script type="module" src="/farcaster-ready.js"></script>

            {/* cache disable */}
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />

            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            {/* ✅ fc:miniapp manifest — URL birebir Vercel domain ile eşleşmeli */}
            <meta
                name="fc:miniapp"
                content={`{
            "version": "1",
            "imageUrl": "https://solitaire-frame.vercel.app/embed-1200x800.png",
            "button": {
              "title": "Play Solitaire 🎮",
              "action": {
                "type": "launch_frame",
                "name": "Solitaire Game",
                "url": "https://solitaire-frame.vercel.app",
                "splashImageUrl": "https://solitaire-frame.vercel.app/splash-200.png",
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
