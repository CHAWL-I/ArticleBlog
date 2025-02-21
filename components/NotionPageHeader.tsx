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
    { pageId: '19df3422532d8092a25ee9bbb2feae72', title: 'HOME', category: 'home' },
    { pageId: '19ff3422532d8077b9a8c28bf15c1395', title: 'ABOUT ME', category: 'about me' },
    { pageId: '19ff3422532d8046b758d593a45594a5', title: 'PORTFOLIO', category: 'portfolio' },
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

  const isDescendantOf = (parentPageId: string) => {
    const allBlocks = recordMap?.block || {};
    return Object.values(allBlocks).some((block: any) => block.value?.parent_id === parentPageId);
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
                link.title === 'HOME' ? '' : 'desktop-only'
              }`}
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
                className="breadcrumb button"
              >
                <span className="page-title">{link.title}</span>
              </components.PageLink>
            ))}
        </nav>
      </div>
    </header>
  );     
}
