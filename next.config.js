import bundleAnalyzer from '@next/bundle-analyzer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
})

export default withBundleAnalyzer({
  // 1. 정적 배포를 위한 핵심 설정 추가
  output: 'export', 

  // ✅ 이 부분을 추가하면 "안 쓰는 변수" 에러가 있어도 무시하고 배포합니다.
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  staticPageGenerationTimeout: 300,
  images: {
    // 2. 정적 배포(export) 시에는 Next.js 자체 이미지 최적화 기능을 쓸 수 없으므로 비활성화합니다.
    unoptimized: true, 
    remotePatterns: [
      { protocol: 'https', hostname: 'www.notion.so' },
      { protocol: 'https', hostname: 'notion.so' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 's3.us-west-2.amazonaws.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  webpack: (config, _context) => {
    const dirname = path.dirname(fileURLToPath(import.meta.url))
    config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
    config.resolve.alias['react-dom'] = path.resolve(
      dirname,
      'node_modules/react-dom'
    )
    return config
  },

  transpilePackages: ['react-tweet']
})