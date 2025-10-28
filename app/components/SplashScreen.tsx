'use client';
export default function SplashScreen({ onConnect }: { onConnect: () => void }) {
    return (
        <div id="farcaster-wall">
            <h2>🃏 Solitaire</h2>
            <p>Test your patience and skill on Farcaster!</p>
            <button className="new-game-btn" onClick={onConnect}>
                ▶ Play Now
            </button>
        </div>
    );
}
