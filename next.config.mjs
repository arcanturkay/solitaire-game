/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/.well-known/farcaster.json',
                headers: [
                    { key: 'Content-Type', value: 'application/json' },
                    { key: 'Cache-Control', value: 'public, max-age=600' },
                ],
            },
        ]
    },
}

export default nextConfig
