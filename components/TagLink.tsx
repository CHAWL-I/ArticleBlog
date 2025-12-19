import { useRouter } from 'next/router'
import React from 'react'
import { useNotionContext } from 'react-notion-x'

export function TagLink({ href, children, ...props }: any) {
  const router = useRouter()
  //const { mapPageUrl } = useNotionContext()
  
  // 1. 현재 브라우저의 경로 (ID만 추출)
  const currentPath = router.asPath.split('?')[0]
  const currentPageId = currentPath.split('-').pop()?.replace(/\//g, '')

  // 2. 링크의 경로 (ID만 추출)
  const linkPageId = href?.split('-').pop()?.replace(/\//g, '')

  // 3. ID 매칭 여부 확인
  const isSelected = currentPageId && linkPageId && currentPageId === linkPageId

  return (
    <a
      href={href}
      {...props}
      className={`${props.className || ''} ${isSelected ? 'notion-link-selected' : ''}`}
    >
      {children}
    </a>
  )
}