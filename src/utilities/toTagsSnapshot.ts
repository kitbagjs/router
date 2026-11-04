import { ResolvedLinkTag, ResolvedMetaTag, TagGroup, TagsSnapshot } from '@/types/tags'
import { copyTag } from '@/utilities/copyTag'

export function toTagsSnapshot(groups: readonly TagGroup[]): TagsSnapshot {
  const meta: ResolvedMetaTag[] = []
  const link: ResolvedLinkTag[] = []
  let title: string | undefined

  for (const group of groups) {
    switch (group.tag) {
      case 'title':
        title = group.value
        break
      case 'meta':
        meta.push(copyTag(group.value))
        break
      case 'link':
        link.push(copyTag(group.value))
        break
      default:
        group satisfies never
    }
  }

  return { title, meta, link }
}
