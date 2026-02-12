import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import TableOfContents from "@/components/TableOfContents"; // ✅ TOC 컴포넌트 가져오기
import { domain, isDev } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (context) => {
  const rawPageId = context.params.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)
    const anyProps = props as any

    if (anyProps.recordMap) {
      // 1. [ID & 제목 수리] 블록 데이터를 순회하며 클릭과 제목 문제를 동시에 해결합니다.
      if (anyProps.recordMap.block) {
        const blocks = anyProps.recordMap.block
        Object.keys(blocks).forEach((id) => {
          const block = blocks[id]?.value
          if (!block) return

          // ✅ [클릭 해결] 모든 블록에 ID를 확실히 심어 페이지 이동이 가능하게 합니다.
          if (!block.id) block.id = id

          // ✅ [제목 해결] 페이지나 카드 형태의 블록인데 제목이 없으면 보정합니다.
          if (block.type === 'page' || block.type === 'collection_view_page') {
            if (!block.properties) block.properties = {}
            
            // 만약 '이름' 속성 데이터가 title 키에 없다면, 데이터가 들어있는 다른 키를 찾아 복사합니다.
            if (!block.properties.title || !Array.isArray(block.properties.title)) {
              const fallbackKey = Object.keys(block.properties).find(key => Array.isArray(block.properties[key]))
              block.properties.title = fallbackKey ? block.properties[fallbackKey] : [['제목 없음']]
            }

            // 부모 ID가 없으면 루트 ID를 넣어 구조적 결함을 막습니다.
            if (!block.parent_id) {
              block.parent_id = anyProps.site?.rootNotionPageId || ''
            }
          }
        })
      }

      // 2. [스키마 수리] 데이터베이스 설정(Schema)이 깨져서 카드가 하얗게 나오는 문제를 해결합니다.
      if (anyProps.recordMap.collection) {
        Object.keys(anyProps.recordMap.collection).forEach((colId) => {
          const colValue = anyProps.recordMap.collection[colId]?.value
          if (colValue) {
            // 스키마가 아예 없거나 'title' 속성 정의가 없으면 강제로 주입합니다.
            if (!colValue.schema) {
              colValue.schema = { title: { name: '이름', type: 'title' } }
            } else {
              // '제목' 유형의 속성이 있는지 확인하고, 없으면 title 키를 생성합니다.
              const hasTitle = Object.values(colValue.schema).some((s: any) => s.type === 'title')
              if (!hasTitle) {
                colValue.schema.title = { name: '이름', type: 'title' }
              }
            }
          }
        })
      }
    }

    // 3. [에러 방지] 모든 undefined를 null로 바꿔서 빌드 멈춤 현상을 방지합니다.
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




