import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId, uuidToId } from 'notion-utils'

import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { type Site } from './types'

// include UUIDs in page URLs during local development but not in production
// (they're nice for debugging and speed up local dev)
const uuid = !!includeNotionIdInUrls

export const mapPageUrl =
  (site: Site, recordMap: ExtendedRecordMap, searchParams: URLSearchParams) =>
  (pageId: string | null | undefined = '') => {
    if (!pageId) {
      console.warn('🚨 mapPageUrl: pageId가 null 또는 undefined입니다.')
      return createUrl('/', searchParams) // 기본 홈으로 리디렉트
    }

    const pageUuid = parsePageId(pageId, { uuid: true })
    if (!pageUuid) {
      console.warn(`⚠️ mapPageUrl: 유효하지 않은 pageId: ${pageId}`)
      return createUrl('/', searchParams) // 기본 홈으로 리디렉트
    }

    const canonicalId = getCanonicalPageId(pageUuid, recordMap, { uuid })
    if (!canonicalId) {
      console.warn(`⚠️ mapPageUrl: canonicalId가 존재하지 않음: ${pageId}`)
      return createUrl('/', searchParams)
    }

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return createUrl('/', searchParams)
    } else {
      return createUrl(`/${canonicalId}`, searchParams)
    }
  }

export const getCanonicalPageUrl =
  (site: Site, recordMap: ExtendedRecordMap) =>
  (pageId: string | null | undefined = '') => {
    if (!pageId) {
      console.warn('🚨 getCanonicalPageUrl: pageId가 null 또는 undefined입니다.')
      return `https://${site.domain}`
    }

    const pageUuid = parsePageId(pageId, { uuid: true })
    if (!pageUuid) {
      console.warn(`⚠️ getCanonicalPageUrl: 유효하지 않은 pageId: ${pageId}`)
      return `https://${site.domain}`
    }

    const canonicalId = getCanonicalPageId(pageUuid, recordMap, { uuid })
    if (!canonicalId) {
      console.warn(`⚠️ getCanonicalPageUrl: canonicalId가 존재하지 않음: ${pageId}`)
      return `https://${site.domain}`
    }

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return `https://${site.domain}`
    } else {
      return `https://${site.domain}/${canonicalId}`
    }
  }

function createUrl(path: string, searchParams: URLSearchParams) {
  return [path, searchParams.toString()].filter(Boolean).join('?')
}
