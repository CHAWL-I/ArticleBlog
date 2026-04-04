import type { ExtendedRecordMap } from 'notion-types'

/**
 * Notion's unofficial API sometimes returns block/collection entries as
 * `{ value: { value: actualBlock } }`. react-notion-x expects a single `.value`.
 * Without this, the home page (index) can SSR as an empty tree while dynamic
 * routes work if they run the unwrap in getStaticProps.
 */
export function normalizeRecordMap(recordMap: ExtendedRecordMap | undefined): void {
  if (!recordMap) return

  const { block, collection } = recordMap

  if (recordMap.collection_view) {
    Object.keys(recordMap.collection_view).forEach((id) => {
      const cv = recordMap.collection_view![id]
      if (cv?.value?.value) {
        cv.value = cv.value.value
      }
    })
  }

  if (collection) {
    Object.keys(collection).forEach((id) => {
      if (collection[id]?.value?.value) {
        collection[id].value = collection[id].value.value
      }
      if (collection[id]?.value && !collection[id].value.schema) {
        collection[id].value.schema = {}
      }
    })
  }

  if (!block) return

  Object.keys(block).forEach((id) => {
    if (block[id]?.value?.value) {
      block[id].value = block[id].value.value
    }
    const b = block[id]?.value
    if (!b) return

    if (!b.id) b.id = id
    if (!b.properties) b.properties = {}

    if (
      (b.type === 'page' || b.type === 'collection_view_page') &&
      (!b.properties.title || b.properties.title.length === 0)
    ) {
      const fallback = Object.values(b.properties).find(
        (v) => Array.isArray(v) && v.length > 0
      )
      if (fallback) b.properties.title = fallback
    }

    if (b.content && !b.format?.page_cover) {
      const imgId = b.content.find(
        (cId) => block[cId]?.value?.type === 'image'
      )
      if (imgId && block[imgId].value.properties?.source) {
        if (!b.format) b.format = {}
        b.format.page_cover = block[imgId].value.properties.source[0][0]
      }
    }
  })
}
