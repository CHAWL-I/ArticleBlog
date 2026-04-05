import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId } from 'notion-utils'

import * as acl from './acl'
import { environment, pageUrlAdditions, pageUrlOverrides, site } from './config'
import { db } from './db'
import { getSiteMap } from './get-site-map'
import { getPage } from './notion'

export async function resolveNotionPage(domain: string, rawPageId?: string) {
  let pageId: string
  let recordMap: ExtendedRecordMap

  if (rawPageId && rawPageId !== 'index') {
    pageId = parsePageId(rawPageId)

    if (!pageId) {
      const override = pageUrlOverrides[rawPageId] || pageUrlAdditions[rawPageId]
      if (override) {
        pageId = parsePageId(override)
      }
    }

    const useUriToPageIdCache = true
    const cacheKey = `uri-to-page-id:${domain}:${environment}:${rawPageId}`
    const cacheTTL = 3600000 // 1 hour

    if (!pageId && useUriToPageIdCache) {
      try {
        pageId = await db.get(cacheKey)
      } catch (err) {
        console.warn(`redis error get "${cacheKey}"`, err.message)
      }
    }

    if (pageId) {
      recordMap = await getPage(pageId)
    } else {
      // ✅ 1단계: 사이트맵을 먼저 가져옵니다.
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        // ✅ 2단계: 사이트맵에 이미 데이터가 있다면(pageMap) 그걸 쓰고, 없으면 그때만 getPage를 호출합니다.
        // 이 한 줄이 52개 페이지 빌드 시 노션 서버를 살리는 핵심입니다.
        recordMap = siteMap.pageMap[pageId] || (await getPage(pageId))

        if (useUriToPageIdCache) {
          try {
            await db.set(cacheKey, pageId, cacheTTL)
          } catch (err) {
            console.warn(`redis error set "${cacheKey}"`, err.message)
          }
        }
      } else {
        return {
          error: {
            message: `Not found "${rawPageId}"`,
            statusCode: 404
          }
        }
      }
    }
  } else {
    // ✅ 루트 페이지(메인) 처리
    pageId = site.rootNotionPageId
    
    // 메인 페이지도 사이트맵에 이미 포함되어 있을 확률이 높으므로 확인 후 호출합니다.
    const siteMap = await getSiteMap()
    recordMap = siteMap.pageMap[pageId] || (await getPage(pageId))
  }

  const props = { site, recordMap, pageId }
  const accessControl = await acl.pageAcl(props)

  // 타입 에러 방지를 위해 구조 분해 할당으로 안전하게 반환합니다.
  return { ...props, ...accessControl }
}