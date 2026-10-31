import { TagElement, TagGroup } from '@/types/tags'

function flattenRelated<T extends { related?: readonly T[] }>(tag: 'meta' | 'link', descriptor: T): TagElement[] {
  const attributes: Record<string, string> = {}

  for (const [name, value] of Object.entries(descriptor)) {
    if (name === 'key' || name === 'related') {
      continue
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      attributes[name] = String(value)
    }
  }

  return [
    Object.freeze({ tag, attributes: Object.freeze(attributes) }),
    ...descriptor.related?.flatMap((related) => flattenRelated(tag, related)) ?? [],
  ]
}

export function flattenTags(groups: readonly TagGroup[]): readonly TagElement[] {
  return Object.freeze(groups.flatMap((group) => {
    if (group.tag === 'title') {
      return [Object.freeze({ tag: group.tag, attributes: Object.freeze({}), textContent: group.value })]
    }

    if (group.tag === 'meta') {
      return flattenRelated('meta', group.value)
    }

    return flattenRelated('link', group.value)
  }))
}
