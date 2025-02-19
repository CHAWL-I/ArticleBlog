import type * as types from 'notion-types';
import { useRouter } from 'next/router';
import * as React from 'react';
import { Search, useNotionContext } from 'react-notion-x';

import { isSearchEnabled } from '@/lib/config';

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock;
}) {
  const { components, mapPageUrl, recordMap } = useNotionContext();
  const router = useRouter();

  // ✅ 항상 표시할 특정 페이지 ID
  const fixedPages = [
    { pageId: '19df3422532d8092a25ee9bbb2feae72', title: 'Home', path: '/' },
    { pageId: '19ff3422532d8077b9a8c28bf15c1395', title: 'About me', path: '/about-me' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'Portfolio', path: '/portfolio' },
    { pageId: '19ff3422532d80b6b991e9459ddd4927', title: 'Blog', path: '/blog' }
  ];

  // ✅ 현재 URL에서 상위 메뉴 찾기
  const getActiveMenu = () => {
    const currentPath = router.asPath.split('?')[0]; // 쿼리 스트링 제거

    const activeMenu = fixedPages.find((page) => {
      if (page.path === '/') {
        // Home은 정확히 '/'와만 매칭
        return currentPath === '/';
      } else {
        // 나머지는 경로 포함 여부로 매칭
        return currentPath.startsWith(page.path) || currentPath.includes(page.pageId);
      }
    });

    return activeMenu?.pageId || null;
  };

  const activePageId = getActiveMenu();

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        {/* ✅ 커스텀 네비게이션 */}
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => {
            const pageBlock = recordMap?.block?.[link.pageId]?.value;

            // ✅ 현재 경로 가져오기 (쿼리 스트링 제거)
            const currentPath = router.asPath.split('?')[0];

            // ✅ 현재 메뉴 활성화 여부 확인
            const isActive = link.pageId === activePageId;

            // Notion 페이지 제목 가져오기
            const pageTitle = pageBlock?.properties?.title?.[0]?.[0] || link.title;

            return (
              <components.PageLink
                href={mapPageUrl(link.pageId)}
                key={index}
                className={`breadcrumb button ${isActive ? 'active-link' : ''}`}
              >
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

