export const metadata = {
    title: "Solitaire",
    description: "Play Solitaire in Farcaster Mini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            {/* Farcaster MiniApp manifest */}
            <meta
                name="fc:miniapp"
                content='{
                    "version":"1",
                    "imageUrl":"https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png",
                    "button":{
                        "title":"Play Solitaire",
                        "action":{
                            "type":"launch_frame",
                            "name":"Solitaire",
                            "url":"https://solitaire-game-chi-gules.vercel.app/",
                            "splashImageUrl":"https://solitaire-game-chi-gules.vercel.app/splash-200.png",
                            "splashBackgroundColor":"#0A5323"
                        }
                    }
                }'
            />

            {/* Farcaster Frame metadata (vNext uyumlu) */}
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="https://solitaire-game-chi-gules.vercel.app/splash-200.png" />
            <meta property="fc:frame:button:1" content="Play Now" />
            <meta property="fc:frame:post_url" content="https://solitaire-game-chi-gules.vercel.app/api/start" />

            {/* OpenGraph / sosyal paylaşım */}
            <meta property="og:title" content="Solitaire" />
            <meta property="og:description" content="Play Solitaire in Farcaster Mini" />
            <meta property="og:image" content="https://solitaire-game-chi-gules.vercel.app/embed-1200x800.png" />

            {/* Mobil görünüm */}
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>

        <body>{children}</body>
        </html>
    );
}
