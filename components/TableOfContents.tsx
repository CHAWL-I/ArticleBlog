import { useEffect, useState } from "react";

export default function TableOfContents() {
  console.log("📌 TableOfContents 컴포넌트 실행됨");

  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);

  useEffect(() => {
    console.log("⏳ useEffect 실행됨");

    // ✅ 목차를 이동할 부모 요소 찾기
    const targetParent = document.querySelector(".notion-page-content.notion-page-content-has-aside.notion-page-content-has-toc");

    if (!targetParent) {
      console.log("⚠️ notion-page-content 요소를 찾을 수 없음");
      return;
    }

    // ✅ 기존 top-toc 요소 찾기
    const tocElement = document.querySelector(".top-toc");

    if (tocElement) {
      console.log("✅ top-toc 요소를 찾음, notion-page-content 내부로 이동");
      targetParent.prepend(tocElement); // ✅ 부모 요소 안으로 이동
    } else {
      console.log("⚠️ top-toc 요소를 찾을 수 없음");
    }

    // ✅ 목차 자동 업데이트 함수
    const updateHeadings = () => {
      const notionContent = document.querySelector(".notion-content");

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
    });

    observer.observe(targetParent, { childList: true, subtree: true });

    // ✅ 최초 실행
    updateHeadings();

    return () => observer.disconnect(); // ✅ Cleanup
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
