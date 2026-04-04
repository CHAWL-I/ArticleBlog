import type { ExtendedRecordMap } from 'notion-types'

/**
 * Notion's private API sometimes omits `id` on block `value` objects. react-notion-x
 * calls `uuidToId(block.id)` when rendering; missing ids crash SSR. Record map keys
 * are always the block id, so we backfill from the key when needed.
 */
export function ensureBlockIds(
  recordMap: ExtendedRecordMap | undefined | null
): void {
  if (!recordMap?.block) return
  for (const [blockId, wrapper] of Object.entries(recordMap.block)) {
    const value = wrapper?.value as { id?: string } | undefined
    if (value && value.id == null && blockId) {
      value.id = blockId
    }
  }
}
