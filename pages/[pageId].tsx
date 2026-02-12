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
  
      Object.keys(blocks).forEach((id) => {
        const blockEntry = blocks[id]
        const blockValue = blockEntry?.value
      
        // 1. 기본 유효성 검사
        if (!blockEntry || !blockValue) {
          delete blocks[id]
          return
        }
      
        // 2. 필수 ID 및 부모 ID 보정
        if (!blockValue.id) blockValue.id = id
        if (!blockValue.parent_id) {
          blockValue.parent_id = anyProps.site?.rootNotionPageId || ''
        }
      
        // 3. 자식 블록 필터링 (유령 블록 제거)
        if (Array.isArray(blockValue.content)) {
          blockValue.content = blockValue.content.filter((childId) => {
            return childId && blocks[childId] && blocks[childId].value
          })
        }
      
        // 4. [핵심] 속성(properties) 및 제목(title) 방어 - 중복 제거 및 통합
        // 모든 블록은 최소한 비어있는 properties와 title 배열을 가져야 렌더링 시 터지지 않습니다.
        if (!blockValue.properties) {
          blockValue.properties = {}
        }
      
        if (!blockValue.properties.title || !Array.isArray(blockValue.properties.title)) {
          blockValue.properties.title = [[' ']] 
        }
      
        // 5. 데이터베이스(Collection) 전용 방어 로직
        if (blockValue.type === 'collection_view' || blockValue.type === 'collection_view_page') {
          const collectionId = blockValue.collection_id
          const collection = anyProps.recordMap.collection?.[collectionId]?.value
      
          if (!collectionId || !collection) {
            if (!anyProps.recordMap.collection) anyProps.recordMap.collection = {}
            anyProps.recordMap.collection[collectionId] = {
              value: {
                name: [['데이터 로딩 중...']],
                schema: { title: { name: 'title', type: 'title' } } // 스키마 기본값 추가
              }
            }
          } else if (!collection.schema) {
            collection.schema = { title: { name: 'title', type: 'title' } }
          }
          
          // 뷰(View) 필터링
          if (blockValue.view_ids && Array.isArray(blockValue.view_ids)) {
            blockValue.view_ids = blockValue.view_ids.filter(viewId => !!anyProps.recordMap.collection_view?.[viewId])
          }
        }
      })
    }
  
    // 🔍 핵심 수정: 특정 속성만 null로 바꾸는 대신, 전체 객체를 대상으로 수행합니다.
    // JSON.stringify의 replacer 함수를 사용하여 모든 undefined를 null로 세척합니다.
    const cleanProps = JSON.parse(
      JSON.stringify(props, (key, value) => (value === undefined ? null : value))
    )
  
    return {
      props: cleanProps // 정제된 데이터를 리턴
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




