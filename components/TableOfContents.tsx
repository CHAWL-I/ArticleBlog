import React, { useEffect, useState } from "react";

export default function TableOfContents() {
  console.log("📌 TableOfContents 컴포넌트 실행됨");

  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
  const [tocUpdated, setTocUpdated] = useState(false); // ✅ 강제 리렌더링을 위한 상태 추가

  useEffect(() => {
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
          const headingElements = Array.from(notionPageContentInner.querySelectorAll(".notion-h, .notion-h1, .notion-h2, .notion-h3"));

          console.log("📌 찾은 목차 목록:", headingElements);

          if (headingElements.length > 0) {
            const newHeadings = headingElements
              .map((heading) => {
                let id = heading.id || heading.getAttribute("data-id"); // ✅ `id`가 없으면 `data-id` 사용
                let titleElement = heading.querySelector(".notion-h-title"); // ✅ notion-h-title 내부 텍스트 가져오기
                let text = titleElement ? titleElement.textContent?.trim() : "제목 없음"; // ✅ `notion-h-title` 내부에서 텍스트 추출

                return id ? { id, text } : null; // ✅ `id`가 없는 경우 필터링
              })
              .filter(Boolean) as { id: string; text: string }[];

            console.log("📌 업데이트된 headings:", newHeadings);

            setHeadings(newHeadings);
            setTocUpdated((prev) => !prev); // ✅ 상태 강제 변경 (UI 리렌더링 유도)
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
      clearInterval(waitForNotionContentInner);
    };
  }, []);

  // ✅ headings 상태 변경 감지
  useEffect(() => {
    console.log("📌 현재 headings 상태 업데이트됨:", headings);
  }, [headings]);

  // ✅ 상태 변경 감지 후 강제 리렌더링
  useEffect(() => {
    console.log("📌 tocUpdated 상태 변경 감지됨, UI 리렌더링 실행");
  }, [tocUpdated]);

  return (
    <nav className="top-toc">
      {headings.length > 0 ? (
        headings.map((heading) => (
          <a key={heading.id} href={`#${heading.id}`} className="toc-link">
            {heading.text}
          </a>
        ))
      ) : (
        <span>목차 없음</span>
      )}
    </nav>
  );
}



