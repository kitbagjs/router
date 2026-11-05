import { LinkTagSelector, MetaTagSelector, TagGroup, TagName, TagSelector, TagsSnapshot } from '@/types/tags'
import { matchesTag } from '@/services/mergeTags'
import { copyTag } from '@/utilities/copyTag'

function toSelector(tag: TagName, selector: MetaTagSelector | LinkTagSelector): TagSelector {
  const attributes: Record<string, string> = {}

  for (const [name, value] of Object.entries<string | undefined>(selector)) {
    if (value !== undefined) {
      attributes[name] = value
    }
  }

  return { tag, attributes }
}

export function toTagsSnapshot(groups: readonly TagGroup[]): TagsSnapshot {
  const metaGroups: TagGroup[] = []
  const linkGroups: TagGroup[] = []
  let title: string | undefined

  for (const group of groups) {
    switch (group.tag) {
      case 'title':
        title = group.value
        break
      case 'meta':
        metaGroups.push({ ...group, attributes: { ...group.attributes }, value: copyTag(group.value) })
        break
      case 'link':
        linkGroups.push({ ...group, attributes: { ...group.attributes }, value: copyTag(group.value) })
        break
      default:
        group satisfies never
    }
  }

  const getMeta: TagsSnapshot['meta']['get'] = (selector) => {
    let target: TagSelector | undefined

    if (selector !== undefined) {
      target = toSelector('meta', selector)
    }

    return metaGroups.flatMap((group) => {
      if (group.tag === 'meta' && (!target || matchesTag(group, target))) {
        return [copyTag(group.value)]
      }

      return []
    })
  }

  const getLink: TagsSnapshot['link']['get'] = (selector) => {
    let target: TagSelector | undefined

    if (selector !== undefined) {
      target = toSelector('link', selector)
    }

    return linkGroups.flatMap((group) => {
      if (group.tag === 'link' && (!target || matchesTag(group, target))) {
        return [copyTag(group.value)]
      }

      return []
    })
  }

  const meta = { get: getMeta }
  const link = { get: getLink }

  return { title, meta, link }
}
