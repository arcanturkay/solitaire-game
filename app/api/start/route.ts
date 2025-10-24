import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({
        frame: {
            version: "1",
            image: "https://solitaire-game-chi-gules.vercel.app/splash-200.png",
            button: {
                title: "Play Solitaire",
                action: {
                    type: "launch_frame",
                    name: "Solitaire",
                    url: "https://solitaire-game-chi-gules.vercel.app/",
                },
            },
        },
    });
}
