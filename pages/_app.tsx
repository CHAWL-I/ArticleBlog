import 'katex/dist/katex.min.css' // 수식 렌더링
import 'prismjs/themes/prism-coy.css' // 코드 하이라이팅
import 'react-notion-x/src/styles.css' // Notion 스타일
import 'styles/global.css' // 전역 스타일
import 'styles/notion.css' // Notion 스타일 오버라이드
import 'styles/prism-theme.css' // Prism 테마
import 'prismjs/themes/prism-okaidia.css'

import type { AppProps } from 'next/app'
import * as Fathom from 'fathom-client'
import { useRouter } from 'next/router'
import posthog from 'posthog-js'
import * as React from 'react'
import { Analytics } from '@vercel/analytics/react'; // 방문자수 분석 관련

/* import { useNotionContext } from 'react-notion-x' // ✅ Notion 컨텍스트 불러오기 */
import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

/*import TagTab from '../components/TagTab';*/

if (!isServer) {
  bootstrap()
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  React.useEffect(() => {
    function onRouteChangeComplete() {
      if (fathomId) {
        Fathom.trackPageview()
      }
      if (posthogId) {
        posthog.capture('$pageview')
      }
    }

    if (fathomId) {
      Fathom.load(fathomId, fathomConfig)
    }

    if (posthogId) {
      posthog.init(posthogId, posthogConfig)
    }

    router.events.on('routeChangeComplete', onRouteChangeComplete)

    return () => {
      router.events.off('routeChangeComplete', onRouteChangeComplete)
    }
  }, [router.events])

  // ✅ 검색 버튼 보이게 설정
  React.useEffect(() => {
    const searchButton = document.querySelector(".notion-search-button") as HTMLElement | null
    if (searchButton) {
      searchButton.style.display = "flex"
      searchButton.style.visibility = "visible"
      searchButton.style.opacity = "1"
    }
  }, [])

  return (
    <>
      <main>
        <Component {...pageProps} />
      </main>
      {/* vercel 방문자수 분석 */}
      <Analytics />
      
      {/* cloudflare 방문자수 분석 */}
      <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "f2cc485e63b84e818867ec28b5ea8a8f"}'></script>
    </>
  )
}