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

/* import { useNotionContext } from 'react-notion-x' // ✅ Notion 컨텍스트 불러오기 */
import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

if (!isServer) {
  bootstrap()
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
/*   const { recordMap } = useNotionContext() // ✅ Notion 페이지 데이터 가져오기 */

  console.log('🚀 _app.tsx 실행됨') // ✅ 실행되는지 확인
  console.log('🔍 pageProps:', pageProps) // ✅ 전달되는 값 확인

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

  // ✅ `recordMap.block`에서 `PageBlock` 또는 `CollectionViewPageBlock`만 가져오기
  /* const block = recordMap?.block
    ? Object.values(recordMap.block)
        .map((b: any) => b.value)
        .find((b) => b.type === 'page' || b.type === 'collection_view_page') // ✅ `page` 또는 `collection_view_page` 타입만 필터링
    : null */

  return (
    <>
      <main>
        <Component {...pageProps} />
      </main>
    </>
  )
}