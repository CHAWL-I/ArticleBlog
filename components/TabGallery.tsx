import React, { useState, useEffect } from 'react';

const TABS = ['전체', '게임분석', '유니티', '드로잉'];

export default function TabGallery() {
  const [activeTab, setActiveTab] = useState('전체');

  // ✅ useEffect로 DOM 조작
  useEffect(() => {
    const allGalleries = document.querySelectorAll('.notion-gallery-view');

    allGalleries.forEach((gallery) => {
      const galleryTag = gallery.getAttribute('data-tag');

      if (activeTab === '전체') {
        gallery.setAttribute('style', 'display: block');
      } else if (galleryTag === activeTab) {
        gallery.setAttribute('style', 'display: block');
      } else {
        gallery.setAttribute('style', 'display: none');
      }
    });
  }, [activeTab]);

  return (
    <div>
      {/* 🔹 탭 버튼 */}
      <div className="tab-container">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 🔹 스타일 */}
      <style jsx>{`
        .tab-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .tab-button {
          margin: 0 10px;
          padding: 10px 20px;
          border: none;
          background: #f5f5f5;
          cursor: pointer;
          transition: background 0.3s;
        }

        .tab-button.active {
          background: #007aff;
          color: white;
        }
      `}</style>
    </div>
  );
}
