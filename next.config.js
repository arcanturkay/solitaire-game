// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        unoptimized: true, // Warpcast sandbox'ta image optimizer devre dışı olmalı
    },
    output: 'standalone',
};

module.exports = nextConfig;
