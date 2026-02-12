import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import TableOfContents from "@/components/TableOfContents"; // ✅ TOC 컴포넌트 가져오기
import { domain, isDev } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)
    const anyProps = props as any
  
    if (anyProps.recordMap && anyProps.recordMap.block) {
      const blocks = anyProps.recordMap.block
  
      // 1. 모든 블록을 검사하여 결함이 있는 데이터를 먼저 제거/수정
      Object.keys(blocks).forEach((id) => {
        const blockEntry = blocks[id]
        const blockValue = blockEntry?.value
  
        // Case A: 블록 데이터 자체가 없거나 value가 없는 경우 -> 맵에서 삭제
        if (!blockEntry || !blockValue) {
          delete blocks[id]
          return
        }
  
        // Case B: id가 없으면 현재 key값으로 채워줌 (uuidToId 에러 방지)
        if (!blockValue.id) {
          blockValue.id = id
        }
  
        // Case C: parent_id가 없는 경우 (uuidToId 에러 방지용 기본값 채우기)
        if (!blockValue.parent_id) {
          blockValue.parent_id = anyProps.site?.rootNotionPageId || ''
        }
  
        // Case D: 자식 블록(content) 필터링
        if (Array.isArray(blockValue.content)) {
          blockValue.content = blockValue.content.filter((childId) => {
            const exists = childId && blocks[childId] && blocks[childId].value
            if (!exists && childId) {
              console.warn(`[빌드 알림] 유령 자식 블록 제거: ${childId}`)
            }
            return exists
          })
        }
        
        // pages/[pageId].tsx 내의 데이터베이스 방어 로직 (Case E)

        // pages/[pageId].tsx 내의 Case E 수정
        if (blockValue.type === 'collection_view' || blockValue.type === 'collection_view_page') {
          const collectionId = blockValue.collection_id;
          const collection = anyProps.recordMap.collection?.[collectionId]?.value;

          // ✅ 핵심 수정: 데이터가 정말 없어서 에러를 일으킬 것 같으면,
          // 라이브러리가 이해할 수 있는 '최소한의 가짜 데이터'를 넣어줍니다.
          if (!collectionId || !collection) {
            console.warn(`[빌드 알림] 데이터 누락으로 인한 안전 모드 전환: ${id}`);
            
            // 방법 1: 에러 방지를 위해 타입은 유지하되, 빈 컬렉션 객체를 강제로 생성
            if (!anyProps.recordMap.collection) anyProps.recordMap.collection = {};
            if (collectionId && !anyProps.recordMap.collection[collectionId]) {
              anyProps.recordMap.collection[collectionId] = {
                value: {
                  name: [['데이터를 불러오는 중...']],
                  schema: {} // 이게 없으면 title 에러가 날 수 있음
                }
              };
            } else {
              // 컬렉션 ID조차 없다면 안전하게 텍스트로 치환 (최후의 수단)
              blockValue.type = 'text';
              blockValue.properties = { title: [['[데이터베이스 로딩 실패]']] };
            }
          } 
          
          // 뷰(View) 정보가 없으면 렌더링 에러가 나므로 체크
          if (blockValue.view_ids && Array.isArray(blockValue.view_ids)) {
            blockValue.view_ids = blockValue.view_ids.filter(viewId => {
              const viewExists = !!anyProps.recordMap.collection_view?.[viewId];
              return viewExists;
            });
            
            // 만약 살아남은 뷰가 하나도 없다면 에러 방지를 위해 텍스트로 치환
            if (blockValue.view_ids.length === 0) {
              blockValue.type = 'text';
              blockValue.properties = { title: [['[설정된 데이터베이스 뷰가 없습니다]']] };
            }
          }
        }
      })
    }
  
    // 2. undefined 속성들 null로 변환 (JSON 직렬화 에러 방지)
    if (anyProps.site && anyProps.site.rootNotionSpaceId === undefined) {
      anyProps.site.rootNotionSpaceId = null
    }
  
    return {
      props: JSON.parse(JSON.stringify(props))
    }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    throw err
  }
}

export async function getStaticPaths() {
  /*if (isDev) {
    return {
      paths: [],
      fallback: false
    }
  }*/

  const siteMap = await getSiteMap()

  const staticPaths = {
    paths: Object.keys(siteMap.canonicalPageMap).map((pageId) => ({
      params: {
        pageId
      }
    })),
    // paths: [],
    // ✅ 정적 배포에서는 반드시 false여야 하며, 
    // 위 paths에 모든 페이지 ID가 포함되어 있어야 합니다.
    fallback: false
  }

  console.log(`빌드 대상 페이지 개수: ${staticPaths.paths.length}`)
  return staticPaths
}

/*export async function getStaticPaths() {
  // 1. 빌드 시 모든 페이지 주소를 계산(getSiteMap)하지 않도록 설정합니다.
  // 2. paths를 빈 배열([])로 두면 빌드 시간이 획기적으로 줄어듭니다.
  // 3. fallback을 'blocking'으로 설정하면, 사용자가 접속하는 순간 노션에서 데이터를 가져옵니다.
  
  return {
    paths: [],
    fallback: 'blocking' 
  }
}*/

export default function NotionDomainDynamicPage(props) {
  return (
    <>
      <TableOfContents /> {/* ✅ 그대로 두기 (자동 이동됨) */}
      <NotionPage {...props} />
    </>
  );
}




