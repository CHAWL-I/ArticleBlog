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
    { pageId: '19df3422532d8092a25ee9bbb2feae72', title: 'Home' },
    { pageId: '19ff3422532d8077b9a8c28bf15c1395', title: 'About me' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'Portfolio' },
    { pageId: '19ff3422532d80b6b991e9459ddd4927', title: 'Blog' }
  ];

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        {/* ✅ 커스텀 네비게이션 */}
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => {
            const pageBlock = recordMap?.block?.[link.pageId]?.value;

            // 현재 경로와 링크를 비교
            const currentPath = router.asPath.split('?')[0]; // 쿼리 스트링 제거
            const targetPath = mapPageUrl(link.pageId);
            const isActive = currentPath === targetPath;

            // Notion 페이지 제목 가져오기
            const pageTitle = pageBlock?.properties?.title?.[0]?.[0] || link.title;

            // Notion 페이지 아이콘 가져오기
            const pageIcon = pageBlock?.format?.page_icon;

            // 아이콘 렌더링: 이모지 또는 이미지 URL
            const renderIcon = () => {
              if (!pageIcon) return ''; // 기본 아이콘

              // 외부 URL 이미지
              if (pageIcon.startsWith('http') || pageIcon.startsWith('https')) {
                return <img src={pageIcon} alt="page icon" className="page-icon-img" />;
              }

              // 내부 Notion 저장소 이미지
              if (pageIcon.startsWith('/')) {
                const notionBaseUrl = 'https://www.notion.so';
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
                href={targetPath}
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
