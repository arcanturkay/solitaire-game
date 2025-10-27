import Providers from './providers';

export const metadata = {
    title: 'Solitaire Game',
    description: 'Play Solitaire directly inside Farcaster 🎮',
    openGraph: {
        title: 'Solitaire Game',
        description: 'Play Solitaire directly inside Farcaster 🎮',
        images: [
            {
                url: 'https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png',
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
            {/* ✅ Temel meta etiketleri */}
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            {/* 🎯 Farcaster Mini App Manifest */}
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

            {/* ✅ Farcaster MiniApps SDK */}
            <script
                src="https://cdn.jsdelivr.net/npm/@farcaster/mini-apps-sdk@0.2.2/dist/browser.js"
                defer
            ></script>

            {/* ✅ Splash otomatik kapatma (fail-safe) */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              (function () {
                function callReady() {
                  try {
                    const fc = window.farcaster?.miniapp?.actions;
                    if (fc && typeof fc.ready === 'function') {
                      fc.ready();
                      return true;
                    }
                  } catch (e) {}
                  return false;
                }

                document.addEventListener('DOMContentLoaded', function () {
                  if (callReady()) return;
                  var tries = 0;
                  var iv = setInterval(function () {
                    tries++;
                    if (callReady() || tries > 20) clearInterval(iv);
                  }, 150);
                });

                // 1.5 sn sonra hâlâ splash açıksa zorla kapat
                setTimeout(callReady, 1500);
              })();
            `,
                }}
            />
        </head>

        {/* ✅ Privy Provider sarmalayıcı */}
        <body>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
