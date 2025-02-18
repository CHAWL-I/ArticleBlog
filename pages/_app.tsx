// ✅ 스타일 관련 import (CSS 관련 파일은 가장 마지막에 배치)
import 'katex/dist/katex.min.css' // 수식 렌더링
import 'prismjs/themes/prism-coy.css' // 코드 하이라이팅
import 'react-notion-x/src/styles.css' // Notion 스타일
import 'styles/global.css' // 전역 스타일
import 'styles/notion.css' // Notion 스타일 오버라이드
import 'styles/prism-theme.css' // Prism 테마
import 'prismjs/themes/prism-okaidia.css'

import type { AppProps } from 'next/app'
import * as Fathom from 'fathom-client'
// ✅ 폰트 로컬 임포트
//import localFont from 'next/font/local'
import { useRouter } from 'next/router'
import posthog from 'posthog-js'
import * as React from 'react'

import { bootstrap } from '@/lib/bootstrap-client'
import {
  fathomConfig,
  fathomId,
  isServer,
  posthogConfig,
  posthogId
} from '@/lib/config'

/* const pretendard = localFont({
  src: '../public/fonts/PretendardGOVVariable.woff2',
  display: 'swap',
  variable: '--font-primary'
})
const wanted = localFont({
  src: '../public/fonts/WantedSansVariable.woff2',
  display: 'swap',
  variable: '--font-wanted'
}) */ // 다크 모드용 (필요하면 활성화)

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

  React.useEffect(() => {
    if (typeof window === "undefined") return; // ✅ 서버 환경에서 실행 방지

    // ✅ `start` 속성이 있는 리스트(`ol[start]`)에 `counter-reset` 적용
    for (const ol of document.querySelectorAll(".notion-list-numbered[start]")) {
      const startValue = ol.getAttribute("start") ? Number.parseInt(ol.getAttribute("start") || "1", 10) : 1;
      ol.setAttribute("style", `counter-reset: list-counter ${startValue - 1}`);
    }
  }, []); // ✅ 페이지 최초 로드시 실행

  return (
    <main>
      <Component {...pageProps} />
    </main>
  );
}