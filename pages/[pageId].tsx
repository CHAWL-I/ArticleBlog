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

    if (anyProps.recordMap) {
      // 1. 블록(Blocks) 순회 및 방어
      if (anyProps.recordMap.block) {
        const blocks = anyProps.recordMap.block
        Object.keys(blocks).forEach((id) => {
          const blockEntry = blocks[id]
          const blockValue = blockEntry?.value

          if (!blockEntry || !blockValue) {
            delete blocks[id]
            return
          }

          if (!blockValue.id) blockValue.id = id
          if (!blockValue.parent_id) {
            blockValue.parent_id = anyProps.site?.rootNotionPageId || ''
          }

          // 자식 블록 필터링
          if (Array.isArray(blockValue.content)) {
            blockValue.content = blockValue.content.filter((childId) => {
              return childId && blocks[childId] && blocks[childId].value
            })
          }

          // 속성 및 제목 방어
          if (!blockValue.properties) {
            blockValue.properties = {}
          }
          if (!blockValue.properties.title || !Array.isArray(blockValue.properties.title)) {
            blockValue.properties.title = [[' ']]
          }
        })
      }

      // 1. [수리 로직] 컬렉션 정보를 삭제하지 않고 부족한 데이터를 강제로 채워넣습니다.
      if (anyProps.recordMap?.collection) {
        Object.keys(anyProps.recordMap.collection).forEach((colId) => {
          const colEntry = anyProps.recordMap.collection[colId]
          
          // 데이터가 아예 없는 경우 최소 구조 생성
          if (!colEntry.value) {
            colEntry.value = {
              name: [['데이터 로딩 중...']],
              schema: { title: { name: 'title', type: 'title' } }
            }
          } 
          
          // schema나 title 설정이 없어서 에러나는 부분만 골라내어 보정
          if (!colEntry.value.schema) {
            colEntry.value.schema = { title: { name: 'title', type: 'title' } }
          } else if (!colEntry.value.schema.title) {
            colEntry.value.schema.title = { name: 'title', type: 'title' }
          }
        })
      }

      // 2. [추가 방어] 개별 카드(블록)들의 제목 데이터 누락 방어
      if (anyProps.recordMap?.block) {
        Object.keys(anyProps.recordMap.block).forEach((id) => {
          const block = anyProps.recordMap.block[id]?.value
          // 페이지나 데이터베이스 항목인데 제목이 없으면 터짐 방지
          if (block && (block.type === 'page' || block.type === 'collection_view_page' || block.type === 'collection_view')) {
            if (!block.properties) block.properties = {}
            if (!block.properties.title) block.properties.title = [[' ']]
          }
        })
      }
    }

    // 3. 모든 undefined를 null로 세척 (JSON 직렬화 에러 방지)
    const cleanProps = JSON.parse(
      JSON.stringify(props, (key, value) => (value === undefined ? null : value))
    )

    return {
      props: cleanProps
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




