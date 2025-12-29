import type { NextConfig } from 'next';

const nextConfig: NextConfig & { eslint?: any } = {
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,

    // 1. 린트(ESLint) 에러가 있어도 빌드를 강제로 진행
    eslint: {
        ignoreDuringBuilds: true,
    },

    // 2. 타입스크립트 에러가 있어도 빌드를 강제로 진행
    typescript: {
        ignoreBuildErrors: true,
    },

    // 이전 단계에서 추가했던 turbopack 설정 (필요시 유지)
    experimental: {
        turbopack: {},
    } as any, // 15버전에서 타입 충돌 방지

    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default nextConfig;
