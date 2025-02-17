import { useEffect, useState } from "react";

export default function TableOfContents() {
  console.log("📌 TableOfContents 컴포넌트 실행됨");

  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    console.log("⏳ useEffect 실행됨");

    const moveTOCToContent = () => {
      const targetParent = document.querySelector(".notion-page");
      const tocElement = document.querySelector(".top-toc");

      // ✅ 이미 이동한 경우 반복 실행하지 않도록 방지
      if (targetParent && tocElement && tocElement.parentElement !== targetParent) {
        console.log("✅ top-toc 요소를 찾음, notion-page 내부로 이동");
        targetParent.prepend(tocElement);
        return true; // ✅ 이동 성공
      }
      return false; // ✅ 이동 실패
    };

    // ✅ `notion-page`가 생성될 때까지 확인, 이미 이동했으면 종료
    const interval = setInterval(() => {
      console.log("🔄 notion-page가 렌더링될 때까지 대기 중...");
      if (moveTOCToContent()) {
        clearInterval(interval); // ✅ 이동이 완료되면 `setInterval` 종료
      }
    }, 500); // 0.5초 간격으로 확인

    // ✅ 목차 자동 업데이트 함수
    const updateHeadings = () => {
      const notionContent = document.querySelector(".notion-page");

      if (!notionContent) {
        console.log("⚠️ Notion 콘텐츠를 찾을 수 없음");
        return;
      }

      const headingElements = Array.from(notionContent.querySelectorAll(".notion-h1, .notion-h2, .notion-h3"));

      console.log("📌 찾은 목차 목록:", headingElements);

      if (headingElements.length > 0) {
        setHeadings(
          headingElements
            .filter((heading) => heading.id)
            .map((heading) => ({
              id: heading.id,
              text: heading.textContent || '',
            }))
        );
      }
    };

    // ✅ MutationObserver 설정 (DOM 변경 감지)
    const observer = new MutationObserver(() => {
      console.log("🔄 DOM 변경 감지됨! (목차 업데이트)");
      updateHeadings();
      moveTOCToContent(); // ✅ `notion-page`가 변경될 때도 다시 이동
    });

    const targetParent = document.querySelector(".notion-page");
    if (targetParent) {
      observer.observe(targetParent, { childList: true, subtree: true });
    }

    // ✅ 최초 실행
    updateHeadings();
    moveTOCToContent();

    return () => {
      observer.disconnect(); // ✅ Cleanup
      clearInterval(interval);
    };
  }, []);

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
