import type * as types from 'notion-types'
/* import { IoMoonSharp } from '@react-icons/all-files/io5/IoMoonSharp'
import { IoSunnyOutline } from '@react-icons/all-files/io5/IoSunnyOutline'
import cs from 'classnames' */
import { useRouter } from 'next/router'
import * as React from 'react'
import { Search, useNotionContext } from 'react-notion-x'

import { isSearchEnabled } from '@/lib/config'
/* import { useDarkMode } from '@/lib/use-dark-mode'

import styles from './styles.module.css' */

/* function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs('breadcrumb', 'button', !hasMounted && styles.hidden)}
      onClick={onToggleTheme}
    >
      {hasMounted && isDarkMode ? <IoMoonSharp /> : <IoSunnyOutline />}
    </div>
  )
}
 */

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components, mapPageUrl, recordMap } = useNotionContext()

  // ✅ 항상 표시할 특정 페이지 ID (Notion의 실제 페이지 ID 입력)
  const fixedPages = [
    { pageId: '19df3422532d8092a25ee9bbb2feae72', title: 'Home' },
    { pageId: '19ff3422532d8077b9a8c28bf15c1395', title: 'About me' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'Portfolio' },
    { pageId: '19ff3422532d80b6b991e9459ddd4927', title: 'Blog' }
  ]

  const router = useRouter()

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        {/* ✅ 커스텀 네비게이션 */}
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => {
            const pageBlock = recordMap?.block?.[link.pageId]?.value;
            
            // 현재 경로와 링크를 비교
            const isActive = router.asPath === mapPageUrl(link.pageId)

            // Notion 페이지 제목 가져오기
            const pageTitle = pageBlock?.properties?.title?.[0]?.[0] || link.title;
  
            // Notion 페이지 아이콘 가져오기
            const pageIcon = pageBlock?.format?.page_icon;
  
            // 아이콘 렌더링: 이모지 또는 이미지 URL
            const renderIcon = () => {
              console.log('페이지 아이콘:', pageIcon); // 디버깅용
            
              if (!pageIcon) return ''; // 기본 아이콘
            
              // 외부 URL인지 확인
              if (pageIcon.startsWith('http') || pageIcon.startsWith('https')) {
                return <img src={pageIcon} alt="page icon" className="page-icon-img" />;
              }
            
              // 내부 Notion 저장소 이미지인 경우
              if (pageIcon.startsWith('/')) {
                const notionBaseUrl = 'https://www.notion.so'; // Notion의 베이스 URL
                return (
                  <img
                    src={`${notionBaseUrl}${pageIcon}`}
                    alt="page icon"
                    className="page-icon-img"
                  />
                );
              }
            
              // 이모지인 경우
              return <span className="page-icon">{pageIcon}</span>;
            };            
  
            return (
              <components.PageLink
                href={mapPageUrl(link.pageId)}
                key={index}
                className={`breadcrumb button ${isActive ? 'active-link' : ''}`}
              >
                {renderIcon()}
                <span className="page-title">{pageTitle}</span>
              </components.PageLink>
            );
          })}
        </nav>
  
        <div className="notion-nav-header-rhs">
          {isSearchEnabled && <Search block={block} title={null} />}
        </div>
      </div>
    </header>
  );  
}
