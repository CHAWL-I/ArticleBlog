import React, { useEffect,useState } from "react";

const TAGS = ["전체", "게임분석", "유니티", "드로잉"];

export default function TabGallery() {
  const [activeTag, setActiveTag] = useState(TAGS[0]); // ✅ 기본 선택된 태그
  const [galleryItems, setGalleryItems] = useState([]); // ✅ 가져온 데이터 저장

  // ✅ 노션 데이터 가져오기 (선택한 태그에 따라 변경)
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/notion-gallery?tag=${activeTag}`);
        const data = await response.json();
        setGalleryItems(data.results); // ✅ 가져온 데이터를 상태에 저장
      } catch (err) {
        console.error("데이터 불러오기 오류:", err);
      }
    }
    fetchData();
  }, [activeTag]); // ✅ activeTag가 변경될 때마다 실행

  return (
    <div>
      {/* 🔹 탭 UI */}
      <div className="tab-container">
        {TAGS.map((tag) => (
          <button
            key={tag}
            className={activeTag === tag ? "active" : ""}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 🔹 노션 갤러리 뷰 */}
      <div className="gallery-container">
        {galleryItems.length > 0 ? (
          galleryItems.map((item) => (
            <div key={item.id} className="gallery-item">
              <h3>{item.properties.Name.title[0]?.plain_text}</h3>
              <p>{item.properties.Description.rich_text[0]?.plain_text}</p>
            </div>
          ))
        ) : (
          <p>불러올 데이터가 없습니다.</p>
        )}
      </div>

      {/* 🔹 스타일 */ }
<style jsx>{`
  .tab-container {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  button {
    margin: 0 10px;
    padding: 10px 20px;
    border: none;
    background: #f5f5f5;
    cursor: pointer;
  }
  .active {
    background: #007aff;
    color: white;
  }
  .gallery-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }
  .gallery-item {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: #fff;
  }
`}</style>
    </div>
  );
}
