import React, { useEffect, useState } from "react";

export default function TableOfContents() {
  console.log("📌 TableOfContents 컴포넌트 실행됨");

  const [headings, setHeadings] = useState<{ id: string; text: string; level: number; fullPath: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1); // ✅ -1은 "목차 없음" 상태
  const [previousScrollY] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true); // ✅ top-toc 표시 여부


  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ 서버 환경에서는 실행하지 않음

    console.log("⏳ useEffect 실행됨");

    const moveTOCToContent = () => {
      const targetParent = document.querySelector(".notion-page-content");
      const tocElement = document.querySelector(".top-toc");

      if (targetParent && tocElement && tocElement.parentElement !== targetParent) {
        console.log("✅ top-toc 요소를 찾음, notion-page 내부로 이동");
        targetParent.prepend(tocElement);
        return true;
      }
      return false;
    };

    // ✅ `notion-page-content`가 생성될 때까지 확인
    const interval = setInterval(() => {
      console.log("🔄 notion-page-content가 렌더링될 때까지 대기 중...");
      if (moveTOCToContent()) {
        clearInterval(interval);
      }
    }, 500);

    // ✅ `notion-page-content-inner`가 렌더링될 때까지 기다림
    const waitForNotionContentInner = setInterval(() => {
      const notionPageContentInner = document.querySelector(".notion-page-content-inner");
      if (notionPageContentInner) {
        console.log("✅ .notion-page-content-inner 요소 감지됨! MutationObserver 설정 시작");

        // ✅ MutationObserver로 `notion-page-content-inner` 내부 감시
        const updateHeadings = () => {
          console.log("🔄 목차 업데이트 실행");
          const headingElements = Array.from(notionPageContentInner.querySelectorAll(".notion-h, .notion-h1, .notion-h2, .notion-h3, .notion-h4"));

          console.log("📌 찾은 목차 목록:", headingElements);

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

    const fullPath = hierarchy.map((h) => h.text).join(" / "); // "h1 / h2 / h3" 형태로 변환

    return { id, text, level, fullPath };
  })
  .filter(Boolean) as { id: string; text: string; level: number; fullPath: string }[];

console.log("📌 업데이트된 headings:", newHeadings);


            setHeadings(newHeadings);
          } else {
            console.log("⚠️ 찾은 목차가 없음");
          }
        };

        const observer = new MutationObserver(() => {
          console.log("🔄 DOM 변경 감지됨! (목차 업데이트 실행)");
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

        console.log("🔎 감지된 섹션 개수:", sections.length);
        if (sections.length === 0) {
          ticking = false;
          return;
        }

        let closestSectionIndex = -1;
        let minDistance = Infinity;
        
        for (const [index, section] of Array.from(sections).entries()) {
            const sectionBottom = section.getBoundingClientRect().bottom;
            const distance = Math.abs(sectionBottom - tocTop);
          
            console.log(`🔹 섹션 ${index}: bottom=${sectionBottom}, distance=${distance}`);
          
            // ✅ `top-toc`보다 위에 있는 섹션만 고려
            if (sectionBottom < tocTop && distance < minDistance) {
              closestSectionIndex = index;
              minDistance = distance;
            }
          }
  
        const newActiveIndex = closestSectionIndex !== -1 ? closestSectionIndex : -1;

        console.log("🎯 최종 감지된 인덱스:", newActiveIndex);

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

  return (
    <nav className="top-toc" style={{ display: isVisible ? "block" : "none" }}>
      {headings.length > 0 && activeIndex !== -1 ? (
        <a key={headings[activeIndex]?.id} href={`#${headings[activeIndex]?.id}`} className="toc-link active">
          {headings[activeIndex]?.fullPath} {/* ✅ 하나의 항목만 표시 */}
        </a>
      ) : null}
    </nav>
  );
}
