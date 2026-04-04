import { type GetStaticProps } from 'next'
import type { ExtendedRecordMap } from 'notion-types'

import { NotionPage } from '@/components/NotionPage'
import TableOfContents from "@/components/TableOfContents"
import { domain } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'
import { normalizeRecordMap } from '@/lib/normalize-record-map'
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
    if ('recordMap' in props && props.recordMap) {
      normalizeRecordMap(props.recordMap as ExtendedRecordMap)
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



