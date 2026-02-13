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

  // 숫자와 영어를 강제로 짝지어서 제시.  절대 경로 - 상대 경로 꼬이지 않아야.
  const navigationMap: Record<string, string> = {
    '306f3422532d80acac71f06797b16a61': 'archive',
    '19ff3422532d8046b758d593a45594a5': 'project',
    '19ff3422532d80b6b991e9459ddd4927': 'blog'
  };

  const fixedPages = [
    { pageId: '2cdf3422532d80bda8a7dd80223460d0', title: 'HOME', category: 'home' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'PROJECT', category: 'project' },
    { pageId: '306f3422532d80acac71f06797b16a61', title: 'ARCHIVE', category: 'archive' },
    { pageId: '19ff3422532d80b6b991e9459ddd4927', title: 'BLOG', category: 'blog' }
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

  // 이동 경로 생성 함수 (절대 경로 '/' 추가가 핵심)
  const getDestination = (pageId: string) => {
    const slug = navigationMap[pageId];
    // 매핑된 슬러그가 있으면 '/slug'로, 없으면 기존 mapPageUrl 사용
    return slug !== undefined ? `/${slug}` : mapPageUrl(pageId);
  };

  return (
    <header className="notion-header">
      <div className="notion-nav-header">
        <nav className="notion-custom-nav">
          {fixedPages.map((link, index) => (
            <components.PageLink
              href={getDestination(link.pageId)} // ✅ 데스크톱 적용
              key={index}
              className={`breadcrumb button ${
                isActive(link.pageId, link.category) ? 'selected' : ''
              } ${link.title === 'HOME' ? 'home-link' : 'desktop-only'}`} // home-link 와 다른 링크 구별
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

        {/* 📌 2. 모바일 메뉴 (mobile-nav) */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          {fixedPages
            .filter(link => link.title !== 'HOME')
            .map((link, index) => (
              <components.PageLink
                // ✅ 중요: 여기도 똑같이 수정해줘야 모바일/상세페이지에서 누를 때 404가 안 납니다!
                href={getDestination(link.pageId)} // ✅ 모바일 메뉴도 영문 주소 강제 적용
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