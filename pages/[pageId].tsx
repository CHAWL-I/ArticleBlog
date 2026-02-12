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

      // 2. [최후의 수단] 컬렉션(Collection) 전수 조사 및 삭제
      // 렌더링 시 참조되는 컬렉션 데이터 자체가 깨져있으면 블록을 고쳐도 터집니다.
      if (anyProps.recordMap.collection) {
        Object.keys(anyProps.recordMap.collection).forEach((colId) => {
          const colEntry = anyProps.recordMap.collection[colId]
          const colValue = colEntry?.value

          // 컬렉션 정보가 없거나, 스키마(schema)가 없으면 렌더링 시 title 에러의 주범이 됩니다.
          if (!colEntry || !colValue || !colValue.schema) {
            console.warn(`[긴급] 깨진 컬렉션 제거로 빌드 우회: ${colId}`)
            delete anyProps.recordMap.collection[colId] // 참조 연결을 끊어버립니다.
          } else if (!colValue.schema.title) {
            // 스키마는 있는데 title 설정이 없는 경우 기본값 주입
            colValue.schema.title = { name: 'title', type: 'title' }
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




