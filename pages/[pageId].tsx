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
      const { block, collection } = anyProps.recordMap

      // 1. [최신 이슈 해결] 컬렉션 중첩 구조 보정
      if (collection) {
        Object.keys(collection).forEach((colId) => {
          const colEntry = collection[colId]
          // 만약 데이터가 value.value 안에 숨어있다면 밖으로 꺼냅니다.
          if (colEntry?.value?.value) {
            collection[colId].value = colEntry.value.value
          }

          const colValue = collection[colId]?.value
          if (!colValue) return
          if (!colValue.schema) colValue.schema = {}
          if (!colValue.schema.title) {
            colValue.schema.title = { name: 'Title', type: 'title' }
          }
        })
      }

      // 2. [최신 이슈 해결] 블록 중첩 구조 보정 및 제목/이미지 복구
      if (block) {
        Object.keys(block).forEach((id) => {
          const entry = block[id]
          
          // 데이터가 value.value 안에 숨어있다면 밖으로 꺼냅니다.
          if (entry?.value?.value) {
            block[id].value = entry.value.value
          }

          const b = block[id]?.value
          if (!b) {
            delete block[id]
            return
          }

          if (!b.id) b.id = id

          // 자식 블록 필터링
          if (Array.isArray(b.content)) {
            b.content = b.content.filter(
              (childId) => typeof childId === 'string' && !!block[childId]
            )
          }

          // 제목 데이터 복구 (properties.title이 비어있을 때 다른 속성에서 가져오기)
          if ((b.type === 'page' || b.type === 'collection_view_page')) {
            if (!b.properties) b.properties = {}
            
            if (!b.properties.title || b.properties.title.length === 0) {
              // 한글 제목 등이 담긴 다른 속성이 있는지 확인
              const fallbackKey = Object.keys(b.properties).find(k => Array.isArray(b.properties[k]) && b.properties[k].length > 0)
              b.properties.title = fallbackKey ? b.properties[fallbackKey] : [['제목 없음']]
            }

            // [이미지] 본문 첫 이미지를 카드 커버로 강제 할당
            if (b.content && !b.format?.page_cover) {
              const firstImgId = b.content.find(cId => block[cId]?.value?.type === 'image')
              if (firstImgId) {
                const imgSource = block[firstImgId]?.value?.properties?.source?.[0]?.[0]
                if (imgSource) {
                  if (!b.format) b.format = {}
                  b.format.page_cover = imgSource
                }
              }
            }
          }
        })
      }
    }

    const safeProps = JSON.parse(
      JSON.stringify(props, (key, value) =>
        value === undefined ? null : value
      )
    )

    return { props: safeProps }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    throw err
  }
}

export async function getStaticPaths() {
  const siteMap = await getSiteMap()
  const staticPaths = {
    paths: Object.keys(siteMap.canonicalPageMap).map((pageId) => ({
      params: { pageId }
    })),
    fallback: false
  }
  return staticPaths
}

export default function NotionDomainDynamicPage(props) {
  return (
    <>
      <TableOfContents />
      <NotionPage {...props} />
    </>
  )
}




