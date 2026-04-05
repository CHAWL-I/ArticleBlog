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
    // ✅ 수정: 캐시 유지 시간을 1시간으로 설정하여 반복 호출 방지
    const cacheTTL = 3600000 

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
      // ✅ 핵심 수정: 사이트맵을 가져올 때 포함된 데이터를 최대한 재사용합니다.
      const siteMap = await getSiteMap()
      pageId = siteMap?.canonicalPageMap[rawPageId]

      if (pageId) {
        // ✅ 수정: siteMap.pageMap에 이미 데이터가 있다면 다시 getPage를 호출하지 않습니다.
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
    pageId = site.rootNotionPageId
    // ✅ 루트 페이지도 사이트맵 데이터를 먼저 확인하도록 최적화 가능하지만, 
    // 최소한 getPage 호출 시 에러가 나지 않도록 유지합니다.
    recordMap = await getPage(pageId)
  }

  const props = { site, recordMap, pageId }
  return { ...props, ...(await acl.pageAcl(props)) }
}