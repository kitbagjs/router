import { isTags, TagLayer, Tags, TAG_OPERATIONS_SYMBOL } from '@/types/tags'

export function toTagLayer(tags: Tags): TagLayer {
  if (!isTags(tags)) {
    throw new TypeError('Expected tags created by createTags')
  }

  const operations = [...tags[TAG_OPERATIONS_SYMBOL]]

  return operations
}
