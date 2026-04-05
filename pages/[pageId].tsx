import { type GetStaticProps } from 'next'
import { NotionPage } from '@/components/NotionPage'
import TableOfContents from "@/components/TableOfContents"
import { domain } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

// 1. 헤더에서 정의하신 슬러그 맵 (통역기)
const navigationMap: Record<string, string> = {
  '19ff3422532d8046b758d593a45594a5': 'project',
  '19ff3422532d80b6b991e9459ddd4927': 'blog',
  '306f3422532d80acac71f06797b16a61': 'archive'
}

const inverseMap = Object.fromEntries(
  Object.entries(navigationMap).map(([id, slug]) => [slug, id])
)

export const getStaticProps: GetStaticProps<PageProps, Params> = async (context) => {
  let rawPageId = context.params.pageId as string

  // 슬러그(blog 등)로 들어오면 실제 노션 ID로 변환
  if (inverseMap[rawPageId]) {
    rawPageId = inverseMap[rawPageId]
  }

  try {
    const props = await resolveNotionPage(domain, rawPageId)
    const anyProps = props as any

    // 2. [최신 노션 API 대응] 데이터 껍질 벗기기 및 수리
    if (anyProps.recordMap) {
      const { block, collection } = anyProps.recordMap

      if (collection) {
        Object.keys(collection).forEach((id) => {
          if (collection[id]?.value?.value) collection[id].value = collection[id].value.value
          if (collection[id]?.value && !collection[id].value.schema) collection[id].value.schema = {}
        })
      }

      if (block) {
        Object.keys(block).forEach((id) => {
          if (block[id]?.value?.value) block[id].value = block[id].value.value
          const b = block[id]?.value
          if (!b) return

          if (!b.id) b.id = id
          if (!b.properties) b.properties = {}

          // 한글 제목 및 데이터 복구 로직
          if ((b.type === 'page' || b.type === 'collection_view_page') && (!b.properties.title || b.properties.title.length === 0)) {
            const fallback = Object.values(b.properties).find(v => Array.isArray(v) && v.length > 0)
            if (fallback) b.properties.title = fallback
          }

          // 본문 이미지 -> 썸네일 강제 주입
          if (b.content && !b.format?.page_cover) {
            const imgId = b.content.find(cId => block[cId]?.value?.type === 'image')
            if (imgId && block[imgId].value.properties?.source) {
              if (!b.format) b.format = {}
              b.format.page_cover = block[imgId].value.properties.source[0][0]
            }
          }
        })
      }
    }

    const safeProps = JSON.parse(JSON.stringify(props, (k, v) => v === undefined ? null : v))
    return { props: safeProps }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    throw err
  }
}

export async function getStaticPaths() {
  const siteMap = await getSiteMap()
  const paths = Object.keys(siteMap.canonicalPageMap).map((id) => ({ params: { pageId: id } }))

  // 슬러그 주소들도 빌드 경로에 추가
  Object.values(navigationMap).forEach(slug => {
    paths.push({ params: { pageId: slug } })
  })

  return { paths, fallback: false }
}

export default function NotionDomainDynamicPage(props) {
  return (
    <>
      <TableOfContents />
      <NotionPage {...props} />
    </>
  )
}



