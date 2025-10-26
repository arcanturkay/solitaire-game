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
            {/* 🎯 Farcaster Mini App Embed Meta */}
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
                "splashBackgroundColor": "#043011"
              }
            }
          }`}
            />

            {/* ✅ Farcaster SDK (UMD Build) — `defer` ile yüklenir */}
            <script
                src="https://cdn.jsdelivr.net/npm/@farcaster/mini-apps-sdk@latest/dist/browser.js"
                defer
            ></script>

            {/* ✅ Splash ekranını kaldırmak ve SDK’yı hazır işaretlemek */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `
              (function(){
                function markReady(){
                  try {
                    if(window.farcaster?.miniapp?.actions?.ready){
                      window.farcaster.miniapp.actions.ready();
                      console.log("✅ Farcaster SDK ready() called");
                      return true;
                    }
                  } catch(e){}
                  return false;
                }

                // SDK geldikten sonra ready() çağırmayı dener
                document.addEventListener("DOMContentLoaded", ()=>{
                  if (markReady()) return;
                  let tries = 0;
                  const iv = setInterval(()=>{
                    if (markReady() || ++tries > 30) clearInterval(iv);
                  }, 150);
                });

                // Yine de en geç 4 saniyede splash'ı kaldır
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
