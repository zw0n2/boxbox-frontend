import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // 정적 내보내기 (next build → ./out 생성)
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,

    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default nextConfig;
