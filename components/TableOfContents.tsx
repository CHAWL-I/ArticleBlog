import React, { useEffect, useState, useRef } from "react";

export default function TableOfContents() {
  /*console.log("📌 TableOfContents 컴포넌트 실행됨");*/

  const [headings, setHeadings] = useState<{ id: string; text: string; level: number; fullPath: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1); // ✅ -1은 "목차 없음" 상태
  const [previousScrollY] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true); // ✅ top-toc 표시 여부
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 토글버튼 판단
  const dropdownRef = useRef(null); // 드롭다운 영역 파악
  const activeItemRef = useRef(null); // 현재 위치의 해당하는 항목
  const [pageTitle, setPageTitle] = useState(""); // ✅ SSR 에러 방지용 상태

  // 1. 클라이언트 사이드 전용 초기화 (document 에러 해결)
  useEffect(() => {
    setPageTitle(document.title); // ✅ 브라우저에서만 실행되도록 보장
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ 서버 환경에서는 실행하지 않음

    const moveTOCToContent = () => {
      const targetParent = document.querySelector(".notion-page-scroller");
      const tocElement = document.querySelector(".top-toc");

      if (targetParent && tocElement && tocElement.parentElement !== targetParent) {
        targetParent.prepend(tocElement);
        return true;
      }
      return false;
    };

    // ✅ `notion-page-content`가 생성될 때까지 확인
    const interval = setInterval(() => {
      //console.log("🔄 notion-page-content가 렌더링될 때까지 대기 중...");
      if (moveTOCToContent()) {
        clearInterval(interval);
      }
    }, 500);

    // ✅ `notion-page-content-inner`가 렌더링될 때까지 기다림
    const waitForNotionContentInner = setInterval(() => {
      const notionPageContentInner = document.querySelector(".notion-page-content-inner");
      if (notionPageContentInner) {

        // ✅ MutationObserver로 `notion-page-content-inner` 내부 감시
        const updateHeadings = () => {
          //console.log("🔄 목차 업데이트 실행");
          const headingElements = Array.from(notionPageContentInner.querySelectorAll(".notion-h, .notion-h1, .notion-h2, .notion-h3, .notion-h4"));

          if (headingElements.length > 0) {
            let hierarchy: { id: string; text: string; level: number }[] = [];

            const newHeadings = headingElements
  .map((heading) => {
    const headingElement = heading as HTMLElement; // ✅ HTMLElement로 변환
    const id = headingElement.id || headingElement.dataset.id; // ✅ `id`가 없으면 `data-id` 사용
    const titleElement = headingElement.querySelector(".notion-h-title"); // ✅ `notion-h-title` 내부 텍스트 가져오기
    const text = titleElement ? titleElement.textContent?.trim() : "제목 없음"; // ✅ `notion-h-title` 내부에서 텍스트 추출
    const level = Number.parseInt(headingElement.tagName.replace("H", ""), 10) || 1; // ✅ Heading Level (H1, H2, H3 등)

    if (!id) return null;

    // ✅ 부모-자식 관계 기반으로 전체 경로 생성
    hierarchy = hierarchy.filter((h) => h.level < level); // 상위 계층 정리
    hierarchy.push({ id, text, level });

    // 부모 경로 추출 (현재 제목을 넣기 전의 hierarchy 상태)
    const fullPath = hierarchy.map((h) => h.text).join(" / "); // "h1 / h2 / h3" 형태로 변환

    return { id, text, level, fullPath };
  })
  .filter(Boolean) as { id: string; text: string; level: number; fullPath: string }[];


            setHeadings(newHeadings);
          } else {
            console.log("⚠️ 찾은 목차가 없음");
          }
        };

        const observer = new MutationObserver(() => {
          //console.log("🔄 DOM 변경 감지 (목차 업데이트 실행)");
          updateHeadings();
        });

        observer.observe(notionPageContentInner, {
          childList: true,
          subtree: true,
          attributes: true, // ✅ 속성 변경 감지 추가
          characterData: true, // ✅ 텍스트 변경 감지 추가
        });

        // ✅ 최초 실행
        updateHeadings();

        // ✅ `setInterval` 중지
        clearInterval(waitForNotionContentInner);
      }
    }, 500); // 0.5초 간격으로 감시

    return () => {
      clearInterval(interval);
      //clearInterval(waitForNotionContentInner);
    };
  }, []);

  // ✅ 현재 스크롤 위치 감지 (top-toc과 겹치는 요소 찾기)
  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ 서버 환경에서 실행 방지

    const tocElement = document.querySelector(".top-toc");
    let ticking = false;

    if (!tocElement) return;

    const checkIntersection = () => {
      //const tocBottom = tocElement.getBoundingClientRect().bottom; // ✅ top-toc의 위치 가져오기
      //const sections = document.querySelectorAll(".notion-h, .notion-h1, .notion-h2, .notion-h3, .notion-h4");

      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const tocElement = document.querySelector(".top-toc");
        if (!tocElement) return;

        //const tocBottom = tocElement.getBoundingClientRect().top;
        const tocTop = tocElement.getBoundingClientRect().bottom;
        const sections = document.querySelectorAll(".notion-h, .notion-h1, .notion-h2, .notion-h3, .notion-h4");

        if (sections.length === 0) {
          ticking = false;
          return;
        }

        let closestSectionIndex = -1;
        let minDistance = Infinity;
        
        for (const [index, section] of Array.from(sections).entries()) {
            const sectionBottom = section.getBoundingClientRect().bottom;
            const distance = Math.abs(sectionBottom - tocTop);
                    
            // ✅ `top-toc`보다 위에 있는 섹션만 고려
            if (sectionBottom < tocTop && distance < minDistance) {
              closestSectionIndex = index;
              minDistance = distance;
            }
          }
  
        const newActiveIndex = closestSectionIndex !== -1 ? closestSectionIndex : -1;

        //console.log("🎯 최종 감지된 인덱스:", newActiveIndex);

        if (newActiveIndex !== activeIndex) {
          console.log("✅ 현재 활성화된 섹션 변경됨:", newActiveIndex);
          setActiveIndex(newActiveIndex);
        }

        // ✅ top-toc을 숨길지 여부 결정 (목차 없음 상태이면 숨김)
        setIsVisible(newActiveIndex !== -1);
  
          setTimeout(() => {
            ticking = false;
          }, 50); // ✅ 너무 자주 실행되지 않도록 50ms 지연
        });
      };

    // ✅ 스크롤 이벤트 리스너 추가
    window.addEventListener("scroll", checkIntersection);
    checkIntersection(); // 최초 실행

    return () => {
      window.removeEventListener("scroll", checkIntersection);
    };
  }, [headings, activeIndex, previousScrollY]);

  // ✅ [중요] 외부 클릭 감지용 useEffect (새로 추가)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // 드롭다운이 열려 있을 때만 동작하며, 클릭된 곳이 dropdownRef(nav 전체) 밖이라면 닫음
      if (isMenuOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    // 전역(window)에 클릭 이벤트 등록
    document.addEventListener("mousedown", handleClickOutside);
    
    // 컴포넌트가 사라질 때 이벤트 리스너도 깨끗하게 청소 (메모리 누수 방지)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]); // isMenuOpen 상태가 바뀔 때마다 리스너 상태 업데이트

  useEffect(() => {
    if (isMenuOpen && activeItemRef.current) {
      // 'nearest' 옵션을 사용하면 이미 화면에 보일 때는 움직이지 않고, 
      // 가려져 있을 때만 최소한으로 움직여서 오류 걱정이 없습니다.
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isMenuOpen]);


  return (
    <nav
      ref={dropdownRef}
      className={`top-toc ${isMenuOpen ? "menu-open" : ""}`}
      style={{
        display: isVisible ? "block" : "none",
        visibility: isVisible ? "visible" : "hidden",
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 0.25s ease-in-out",
      }}
    >
      {/* 1. 오버레이 (본문 클릭 차단) */}
      {isMenuOpen && (
        <div className="toc-overlay" onClick={() => setIsMenuOpen(false)} />
      )}
  
      {/* 2. 상단 현재 위치 표시 영역 (IIFE) */}
      {headings.length > 0 && activeIndex !== -1 ? (() => {
        const activeItem = headings[activeIndex];
        const pathParts = activeItem.fullPath.split(" / ");
        const currentTitle = pathParts.pop();
        const parentPath = pathParts.join(" / ");
  
        return (
          <div className="toc-main">
            <div className="toc-content-wrapper">
              {parentPath && <span className="toc-parent">{parentPath}</span>}
              <a key={activeItem.id} href={`#${activeItem.id}`} className="toc-link active">
                <span className="toc-current">{currentTitle}</span>
              </a>
            </div>
  
            <button 
              className="toc-dropdown-trigger"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation(); // ✅ 핵심: 이벤트가 nav(dropdownRef)로 퍼지는 것을 막아 닫힘 충돌 방지
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <span className="toc-dropdown-icon"></span>
            </button>
          </div>
        ); // ⬅️ toc-main 닫음
      })() : null}
  
      {/* 3. 드롭다운 리스트 (에러 방지를 위해 IIFE 밖에 배치) */}
      <div className={`toc-dropdown-list ${isMenuOpen ? 'show' : ''}`}>
        <div className="toc-dropdown-page-title">
          {pageTitle}
        </div>
        <div className="dropdown-divider" />
  
        {headings.map((h, index) => (
          <a 
            key={h.id}
            ref={index === activeIndex ? activeItemRef : null} 
            href={`#${h.id}`} 
            className={`toc-dropdown-item level-${h.level} ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >   
            {h.text}
          </a>
        ))}
        
        {/* 4. 하단 여백 공간 */}
        <div className="toc-dropdown-bottom-space" />
      </div>
    </nav>
  );
  
}
