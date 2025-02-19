import React, { useEffect, useState } from "react";

export default function TagTab() {
  console.log("📌 TagTab 컴포넌트 실행됨");

  const [activeTag, setActiveTag] = useState<number>(0); // 인덱스로 관리
  const [shouldRender, setShouldRender] = useState<boolean>(false); // 렌더링 여부
  const TAGS = ["전체", "게임분석", "유니티", "드로잉"]; // 탭 이름

  useEffect(() => {
    if (typeof window === "undefined") return; // 서버 환경에서는 실행 방지

    console.log("⏳ TagTab useEffect 실행됨");

    const checkForTagTabText = () => {
      // ✅ 특정 구조를 가진 .notion-text 요소를 찾음
      const tagTabTextElement = document.querySelector(
        ".notion-page.notion-page-has-cover.notion-page-no-icon.notion-page-has-text-icon.notion-full-page .notion-text"
      );

      if (tagTabTextElement && tagTabTextElement.textContent?.trim() === "TagTab") {
        console.log("✅ 'TagTab' 텍스트 발견됨, 컴포넌트 렌더링");
        setShouldRender(true);

        // 숨기기 (화면에 보이지 않도록)
        (tagTabTextElement as HTMLElement).style.display = "none";
      }
    };

    const moveTagTabToContent = () => {
      const targetParent = document.querySelector(".notion-page-content-inner");
      const tagTabElement = document.querySelector(".tag-tab");

      if (targetParent && tagTabElement && tagTabElement.parentElement !== targetParent) {
        console.log("✅ TagTab 요소를 찾음, notion-page-content-inner로 이동");
        targetParent.prepend(tagTabElement); // TagTab을 가장 위로 이동
        return true;
      }
      return false;
    };

    // ✅ 태그탭 텍스트를 검사하고 위치 이동
    const interval = setInterval(() => {
      console.log("🔄 TagTab 조건 검사 중...");
      checkForTagTabText();
      if (shouldRender && moveTagTabToContent()) {
        clearInterval(interval);
      }
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [shouldRender]);

  // ✅ 태그 클릭 핸들러
  const handleTagClick = (index: number) => {
    setActiveTag(index);

    console.log(`✅ '탭 ${index + 1}' 클릭됨!`);

    // ✅ notion-collection 필터링
    const collections = document.querySelectorAll(".notion-collection");
    for (const [idx, collection] of collections.entries()) {
      if (idx === index) {
        (collection as HTMLElement).style.display = "block"; // 선택된 컬렉션 표시
      } else {
        (collection as HTMLElement).style.display = "none"; // 나머지는 숨김
      }
    }
  };

  // ✅ 조건을 충족하지 않으면 렌더링하지 않음
  if (!shouldRender) return null;

  return (
    <div className="tag-tab-container">
    <div className="tag-tab">
      {TAGS.map((tag, index) => (
        <button
          key={tag}
          onClick={() => handleTagClick(index)}
          className={`tag-button ${activeTag === index ? "active" : ""}`}
        >
          {tag}
        </button>
      ))}
    </div>
    </div>
  );
}