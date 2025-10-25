/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // 🔑 Bu kısım JSON'un doğru Content-Type ile servis edilmesini garanti eder
    async headers() {
        return [
            {
                source: '/.well-known/farcaster.json',
                headers: [
                    { key: 'Content-Type', value: 'application/json' },
                    { key: 'Cache-Control', value: 'public, max-age=600' },
                ],
            },
        ];
    },

    // 🔧 Bazı ortamlarda public klasör erişimini garanti altına alır
    output: 'standalone',
};

export default nextConfig;
