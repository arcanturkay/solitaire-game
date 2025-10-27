/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    async headers() {
        return [
            // ✅ Global CSP izinleri (Farcaster & Privy uyumlu)
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "Content-Security-Policy",
                        value: [
                            "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
                            "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
                            "style-src * 'unsafe-inline' data:;",
                            "img-src * data: blob:;",
                            "frame-ancestors *;",
                        ].join(" "),
                    },
                    {
                        key: "X-Frame-Options",
                        value: "ALLOWALL",
                    },
                ],
            },
        ];
    },

    output: "standalone",
};

export default nextConfig;
