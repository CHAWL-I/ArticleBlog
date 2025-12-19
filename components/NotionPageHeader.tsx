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

  const fixedPages = [
    { pageId: '2cdf3422532d80bda8a7dd80223460d0', title: 'HOME', category: 'home' },
    { pageId: '/about-me', title: 'ABOUT ME', category: 'about-me' },
    { pageId: '/project', title: 'PROJECT', category: 'project' },
    { pageId: '/blog', title: 'BLOG', category: 'blog' }
  ];

  const [currentCategories, setCurrentCategories] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ 카테고리 추출 로직
  useEffect(() => {
    const getPageCategories = () => {
      const allBlocks = recordMap?.block || {};
      const currentPageId = Object.keys(allBlocks)[0];
      const currentBlock = allBlocks[currentPageId]?.value;

      const multiSelectProperty = currentBlock?.properties?.multi_select;

      if (multiSelectProperty && Array.isArray(multiSelectProperty)) {
        return multiSelectProperty.map(([value]: [string]) => value.toLowerCase());
      }

      if (typeof document !== 'undefined') {
        const multiSelectElements = document.querySelectorAll('.notion-property-multi_select-item');
        if (multiSelectElements.length > 0) {
          return Array.from(multiSelectElements).map((el) => el.textContent?.trim().toLowerCase() || '');
        }
      }

      return [];
    };

    if (recordMap && Object.keys(recordMap).length > 0) {
      const categories = getPageCategories();
      setCurrentCategories(categories);
    }
  }, [recordMap]);

  // ✅ 현재 페이지가 활성화 상태인지 확인 (경로 + 카테고리 비교)
  const isActive = (pageId: string, category: string) => {
    const currentPath = router.asPath.split('?')[0];

    // ✅ 1. 현재 경로가 pageId를 포함하는지 확인
    const pathMatch = currentPath.includes(pageId);

    // ✅ 2. currentCategories에 category가 있는지 확인
    const categoryMatch = currentCategories.includes(category.toLowerCase());

    return pathMatch || categoryMatch;
  };

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        {/* 📌 HOME은 항상 표시 */}
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => (
            <components.PageLink
              href={mapPageUrl(link.pageId)}
              key={index}
              className={`breadcrumb button ${
                isActive(link.pageId, link.category) ? 'selected' : ''
              } ${link.title === 'HOME' ? '' : 'desktop-only'}`}
            >
              <span className="page-title">{link.title}</span>
            </components.PageLink>
          ))}
        </nav>

        {/* 📌 오른쪽: 검색 및 햄버거 메뉴 */}
        <div className="notion-nav-header-rhs">
          {isSearchEnabled && <Search block={block} title={null} />}

          {/* 📌 햄버거 버튼 */}
          <button
            className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>

        {/* 📌 모바일 메뉴 */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          {fixedPages
            .filter(link => link.title !== 'HOME')
            .map((link, index) => (
              <components.PageLink
                href={mapPageUrl(link.pageId)}
                key={index}
                className={`breadcrumb button ${isActive(link.pageId, link.category) ? 'selected' : ''}`}
              >
                <span className="page-title">{link.title}</span>
              </components.PageLink>
            ))}
        </nav>
      </div>
    </header>
  );
}
