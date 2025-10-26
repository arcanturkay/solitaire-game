import '../styles/solitaire.css';
export const metadata = {
    title: "Solitaire Game",
    description: "Play Solitaire directly inside Farcaster 🎮",
    openGraph: {
        title: "Solitaire Game",
        description: "Play Solitaire directly inside Farcaster 🎮",
        images: [
            {
                url: "https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png",
                width: 1200,
                height: 800,
                alt: "Solitaire Game",
            },
        ],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="theme-color" content="#08401b" />

            {/* 🎯 Farcaster MiniApp Embed */}
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
                "splashBackgroundColor": "#08401b"
              }
            }
          }`}
            />

            {/* ✅ Farcaster SDK (npm yok → CDN UMD build) */}
            <script
                src="https://cdn.jsdelivr.net/npm/@farcaster/mini-apps-sdk@0.2.2/dist/browser.js"
                defer
            ></script>

            {/* ✅ Ready() çağrısı + splash fallback */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              (function(){
                function markReady(){
                  try {
                    if(window.farcaster?.miniapp?.actions?.ready){
                      window.farcaster.miniapp.actions.ready();
                      console.log("✅ Farcaster MiniApp ready()");
                      return true;
                    }
                  } catch(e){}
                  return false;
                }

                document.addEventListener("DOMContentLoaded", ()=>{
                  if (markReady()) return;
                  let tries = 0;
                  const iv = setInterval(()=>{
                    if (markReady() || ++tries > 25) clearInterval(iv);
                  }, 150);
                });

                // En geç 4 saniye sonra fallback ready
                setTimeout(markReady, 4000);
              })();
            `,
                }}
            />

        </head>
        <body>{children}</body>
        </html>
    );
}
