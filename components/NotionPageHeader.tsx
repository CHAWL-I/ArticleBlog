import type * as types from 'notion-types';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { Search, useNotionContext } from 'react-notion-x';

import { isSearchEnabled } from '@/lib/config';

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock;
}) {
  const { components, mapPageUrl, recordMap } = useNotionContext();
  const router = useRouter();

  // ✅ 항상 표시할 특정 페이지 ID 및 카테고리
  const fixedPages = [
    { pageId: '19df3422532d8092a25ee9bbb2feae72', title: 'Home', category: 'home' },
    { pageId: '19ff3422532d8077b9a8c28bf15c1395', title: 'About me', category: 'about me' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'Portfolio', category: 'portfolio' },
    { pageId: '19ff3422532d80b6b991e9459ddd4927', title: 'Blog', category: 'blog' }
  ];

  const [currentCategories, setCurrentCategories] = useState<string[]>([]);

  // ✅ 현재 페이지의 카테고리 찾기
  useEffect(() => {
    const getPageCategories = () => {
      const allBlocks = recordMap?.block || {};
      const currentPageId = Object.keys(allBlocks)[0];
      const currentBlock = allBlocks[currentPageId]?.value;

      // 다중 선택 속성 추출 (Notion에서 다중 선택 필드는 'multi_select'로 표시됨)
      const multiSelectProperty = currentBlock?.properties?.multi_select;

      if (multiSelectProperty && Array.isArray(multiSelectProperty)) {
        return multiSelectProperty.map(([value]: [string]) => value.toLowerCase());
      }

      // ✅ 만약 위 방식으로 값이 안 나올 경우, DOM에서 직접 파싱
      if (typeof document !== 'undefined') {
        const multiSelectElements = document.querySelectorAll('.notion-property-multi_select-item');
        if (multiSelectElements.length > 0) {
          return Array.from(multiSelectElements).map((el) => el.textContent?.trim().toLowerCase() || '');
        }
      }

      return [];
    };

    const categories = getPageCategories();
    setCurrentCategories(categories);
  }, [recordMap]);

  // ✅ 현재 페이지가 특정 pageId의 하위인지 확인
  const isDescendantOf = (parentPageId: string) => {
    const allBlocks = recordMap?.block || {};
    return Object.values(allBlocks).some((block: any) => block.value?.parent_id === parentPageId);
  };

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        {/* ✅ 커스텀 네비게이션 */}
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => {
            const pageBlock = recordMap?.block?.[link.pageId]?.value;

            // ✅ 현재 경로 가져오기 (쿼리 스트링 제거)
            const currentPath = router.asPath.split('?')[0];

            // ✅ 활성화 로직:
            // 1. 현재 카테고리에 포함되거나
            // 2. 현재 페이지가 해당 pageId의 하위에 있는 경우
            const isActive =
              currentCategories.includes(link.category.toLowerCase()) ||
              isDescendantOf(link.pageId) ||
              currentPath.includes(link.pageId);

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
