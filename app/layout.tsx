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
            {/* 🎯 Farcaster Mini App Manifest */}
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
            <script
                dangerouslySetInnerHTML={{
                    __html: `
(function(){
  function hasSDK() {
    try {
      return !!(window.farcaster && window.farcaster.miniapp && window.farcaster.miniapp.actions);
    } catch (e) { return false; }
  }

  async function callReady() {
    try {
      if (hasSDK()) {
        await window.farcaster.miniapp.actions.ready();
        console.log("[MiniApp] called actions.ready()");
        return true;
      }
    } catch(e) {
      console.warn("[MiniApp] ready() error:", e);
    }
    return false;
  }

  // DOM yüklendiğinde ve kısa bir süre boyunca SDK'yı bekle
  document.addEventListener('DOMContentLoaded', function(){
    let tries = 0;
    const iv = setInterval(async () => {
      tries++;
      if (await callReady() || tries > 30) clearInterval(iv);
    }, 150);
  });

  // En kötü senaryo: 5sn sonra da bir kere daha dene
  setTimeout(callReady, 5000);
})();
    `,
                }}
            />

        </head>
        <body>{children}</body>
        </html>
    );
}
