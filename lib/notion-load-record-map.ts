import type { ExtendedRecordMap } from 'notion-types'
import {
  getBlockCollectionId,
  getPageContentBlockIds,
  uuidToId
} from 'notion-utils'
import pMap from 'p-map'

import { normalizeRecordMap } from './normalize-record-map'
import { notion } from './notion-api'

async function withNotionRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const maxAttempts = 6
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      lastErr = err
      const msg = err instanceof Error ? err.message : String(err)
      const isRateLimited = msg.includes('429') || msg.includes('Too Many Requests')
      if (isRateLimited && attempt < maxAttempts) {
        const delayMs = Math.min(45_000, 800 * 2 ** attempt)
        console.warn(
          `[notion] ${label} rate limited, retry in ${delayMs}ms (${attempt}/${maxAttempts})`
        )
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
  }
  throw lastErr
}

/**
 * Loads a full Notion record map like notion-client's getPage, but unwraps
 * double-nested `value.value` *before* walking the tree. Otherwise
 * getPageContentBlockIds misses children and collection_view blocks never get
 * queryCollection calls — embedded databases and their rows stay empty.
 */
let notionLoadGate: Promise<unknown> = Promise.resolve()

export function loadNotionRecordMap(pageId: string): Promise<ExtendedRecordMap> {
  const p = notionLoadGate.then(() => loadNotionRecordMapImpl(pageId))
  notionLoadGate = p.then(
    () => undefined,
    () => undefined
  )
  return p
}

async function loadNotionRecordMapImpl(
  pageId: string
): Promise<ExtendedRecordMap> {
  const page = await withNotionRetry(
    () => notion.getPageRaw(pageId),
    `getPageRaw(${uuidToId(pageId)})`
  )
  const recordMap = page?.recordMap as ExtendedRecordMap | undefined

  if (!recordMap?.block) {
    throw new Error(`Notion page not found "${uuidToId(pageId)}"`)
  }

  recordMap.collection = recordMap.collection ?? {}
  recordMap.collection_view = recordMap.collection_view ?? {}
  recordMap.notion_user = recordMap.notion_user ?? {}
  recordMap.collection_query = {}
  recordMap.signed_urls = {}

  normalizeRecordMap(recordMap)

  const concurrency = 1
  const collectionReducerLimit = 999

  while (true) {
    const pendingBlockIds = getPageContentBlockIds(recordMap).filter(
      (id) => !recordMap.block[id]
    )
    if (!pendingBlockIds.length) break
    const newBlocks = await withNotionRetry(
      () =>
        notion
          .getBlocks(pendingBlockIds)
          .then(
            (res: { recordMap: { block: typeof recordMap.block } }) =>
              res.recordMap.block
          ),
      `getBlocks(${pendingBlockIds.length} blocks)`
    )
    recordMap.block = { ...recordMap.block, ...newBlocks }
    normalizeRecordMap(recordMap)
  }

  const contentBlockIds = getPageContentBlockIds(recordMap)
  const allCollectionInstances = contentBlockIds.flatMap((blockId) => {
    const block = recordMap.block[blockId]?.value
    const collectionId =
      block &&
      (block.type === 'collection_view' ||
        block.type === 'collection_view_page') &&
      getBlockCollectionId(block, recordMap)
    if (collectionId) {
      const spaceId = block?.space_id
      return (
        block.view_ids?.map((collectionViewId: string) => ({
          collectionId,
          collectionViewId,
          spaceId
        })) ?? []
      )
    }
    return []
  })

  await pMap(
    allCollectionInstances,
    async (collectionInstance: {
      collectionId: string
      collectionViewId: string
      spaceId?: string
    }) => {
      const { collectionId, collectionViewId, spaceId } = collectionInstance
      const collectionView =
        recordMap.collection_view[collectionViewId]?.value
      try {
        const collectionData = await withNotionRetry(
          () =>
            notion.getCollectionData(
              collectionId,
              collectionViewId,
              collectionView,
              {
                limit: collectionReducerLimit,
                spaceId
              }
            ),
          `getCollectionData(${uuidToId(collectionId)})`
        )
        recordMap.block = {
          ...recordMap.block,
          ...collectionData.recordMap.block
        }
        recordMap.collection = {
          ...recordMap.collection,
          ...collectionData.recordMap.collection
        }
        recordMap.collection_view = {
          ...recordMap.collection_view,
          ...collectionData.recordMap.collection_view
        }
        recordMap.notion_user = {
          ...recordMap.notion_user,
          ...collectionData.recordMap.notion_user
        }
        recordMap.collection_query[collectionId] = {
          ...recordMap.collection_query[collectionId],
          [collectionViewId]: collectionData.result?.reducerResults
        }
        normalizeRecordMap(recordMap)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        console.warn(
          'NotionAPI collectionQuery error',
          { pageId, collectionId, collectionViewId },
          message
        )
      }
    },
    { concurrency }
  )

  const finalContentIds = getPageContentBlockIds(recordMap)
  await withNotionRetry(
    () =>
      notion.addSignedUrls({
        recordMap,
        contentBlockIds: finalContentIds
      }),
    'addSignedUrls'
  )

  return recordMap
}
