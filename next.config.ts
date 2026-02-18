import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // 1. ESLint 경고 해결: 'eslint' 키는 이제 지원되지 않으므로 제거합니다.
    // 빌드 시 린트 에러를 무시하려면 'next build --no-lint' 명령어를 사용하세요.

    // 정적 내보내기 설정
    output: 'export',
    images: { unoptimized: true },
    trailingSlash: true,

    // 2. Turbopack 에러 해결:
    // Next.js 16은 Turbopack이 기본이므로, webpack 설정을 썼다면
    // Turbopack에서도 SVG를 처리할 수 있도록 규칙(rules)을 명시해야 합니다.
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },

    // 3. 기존 Webpack 설정 (빌드나 하위 호환성을 위해 유지)
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ['@svgr/webpack'],
        });
        return config;
    },
};

export default nextConfig;
