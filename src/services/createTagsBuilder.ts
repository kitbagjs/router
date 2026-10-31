import { TagGroup, TagLayer, LinkTag, LinkTagSelector, MetaTag, MetaTagSelector, TagOperation, TagSelector, Tags, TagsSnapshot, ResolvedMetaTag, ResolvedLinkTag } from '@/types/tags'
import { MaybePromise } from '@/types/utilities'
import { matchesTag, mergeTags } from '@/services/mergeTags'

type CreateTagsBuilderOptions = {
  /** Supplies ancestor layers only; reads must exclude this scope's previous evaluation and its descendants. */
  getParentLayers?: () => MaybePromise<readonly TagLayer[]>,
}

function createSelector<TTag extends TagSelector['tag']>(tag: TTag, attributes: Record<string, string>): TagSelector & { tag: TTag } {
  return Object.freeze({ tag, attributes: Object.freeze(attributes) })
}

function copyMeta(descriptor: MetaTag): ResolvedMetaTag {
  const related = descriptor.related?.map(copyMeta)

  return Object.freeze({
    ...descriptor,
    ...related === undefined ? {} : { related: Object.freeze(related) },
  })
}

function copyLink(descriptor: LinkTag): ResolvedLinkTag {
  const related = descriptor.related?.map(copyLink)

  return Object.freeze({
    ...descriptor,
    ...related === undefined ? {} : { related: Object.freeze(related) },
  })
}

function metaSelector({ name, property, media, key, id }: MetaTagSelector, exact: boolean): TagSelector & { tag: 'meta' } {
  const identifier: Record<string, string> = property === undefined ? { name } : { property }

  return createSelector('meta', {
    ...identifier,
    ...key === undefined ? {} : { key },
    ...exact || media !== undefined ? { media: media ?? '' } : {},
    ...id === undefined ? {} : { id },
  })
}

function linkSelector(value: LinkTagSelector, exact: boolean): TagSelector & { tag: 'link' } {
  const { rel, key, type, sizes, media, hreflang, href } = value

  if (!exact) {
    const attributes: Record<string, string> = {}

    for (const [name, content] of Object.entries<string | undefined>(value)) {
      if (content !== undefined) {
        attributes[name] = content
      }
    }

    return createSelector('link', attributes)
  }

  if (rel === 'canonical') {
    return createSelector('link', { rel })
  }

  if (rel === 'alternate' && hreflang !== undefined) {
    return createSelector('link', { rel, hreflang })
  }

  if (key !== undefined) {
    return createSelector('link', { rel, key })
  }

  if (rel === 'icon' || rel === 'apple-touch-icon' || rel === 'mask-icon') {
    return createSelector('link', { rel, type: type ?? '', sizes: sizes ?? '', media: media ?? '' })
  }

  return createSelector('link', { rel, href: href ?? '' })
}

/**
 * Supplies a fresh callback scope. Reads resolve ancestor layers lazily and include this evaluation's
 * operations. Finish after the callback settles to seal its serializable layer and reject late writes.
 */
export function createTagsBuilder({ getParentLayers = () => [] }: CreateTagsBuilderOptions = {}): { tags: Tags, finish: () => TagLayer } {
  const operations: TagOperation[] = []
  let finished = false

  function record(operation: TagOperation): void {
    if (finished) {
      throw new Error('Cannot modify a finished tag layer')
    }

    operations.push(Object.freeze(operation))
  }

  async function readGroups(): Promise<readonly TagGroup[]> {
    // Capture local writes before awaiting ancestors; later writes belong to the next read.
    const local = Object.freeze([...operations])
    const parents = await getParentLayers()

    return mergeTags([...parents, local])
  }

  async function get(): Promise<TagsSnapshot> {
    const groups = await readGroups()
    const meta: ResolvedMetaTag[] = []
    const link: ResolvedLinkTag[] = []
    let title: string | undefined

    for (const group of groups) {
      switch (group.tag) {
        case 'title':
          title = group.value
          break
        case 'meta':
          meta.push(copyMeta(group.value))
          break
        case 'link':
          link.push(copyLink(group.value))
          break
        default:
          group satisfies never
      }
    }

    return Object.freeze({ title, meta: Object.freeze(meta), link: Object.freeze(link) })
  }

  function writeMeta(kind: 'set' | 'add', descriptor: MetaTag): void {
    const selector = metaSelector(descriptor, true)
    const target = metaSelector(descriptor, descriptor.key === undefined)
    const group: TagGroup = Object.freeze({ ...selector, value: copyMeta(descriptor) })

    record({ kind, target, groups: Object.freeze([group]) })
  }

  function writeLink(kind: 'set' | 'add', descriptor: LinkTag): void {
    const target = linkSelector(descriptor, true)
    const group: TagGroup = Object.freeze({ ...target, value: copyLink(descriptor) })

    record({ kind, target, groups: Object.freeze([group]) })
  }

  const tags: Tags = {
    get,
    title: {
      get: async () => (await get()).title,
      set: (value) => {
        const target = createSelector('title', {})
        const group: TagGroup = Object.freeze({ ...target, value })

        record({ kind: 'set', target, groups: Object.freeze([group]) })
      },
      delete: () => record({ kind: 'delete', target: createSelector('title', {}) }),
    },
    meta: {
      get: async (selector) => {
        const target = selector === undefined ? undefined : metaSelector(selector, false)
        const groups = await readGroups()
        const values = groups.flatMap((group) => {
          if (group.tag === 'meta' && (!target || matchesTag(group, target))) {
            return [copyMeta(group.value)]
          }

          return []
        })

        return Object.freeze(values)
      },
      set: (descriptor) => writeMeta('set', descriptor),
      add: (descriptor) => writeMeta('add', descriptor),
      delete: (selector) => record({ kind: 'delete', target: metaSelector(selector, false) }),
    },
    link: {
      get: async (selector) => {
        const target = selector === undefined ? undefined : linkSelector(selector, false)
        const groups = await readGroups()
        const values = groups.flatMap((group) => {
          if (group.tag === 'link' && (!target || matchesTag(group, target))) {
            return [copyLink(group.value)]
          }

          return []
        })

        return Object.freeze(values)
      },
      set: (descriptor) => writeLink('set', descriptor),
      add: (descriptor) => writeLink('add', descriptor),
      delete: (selector) => record({ kind: 'delete', target: linkSelector(selector, false) }),
    },
  }

  return {
    tags,
    finish: () => {
      finished = true

      return Object.freeze(operations)
    },
  }
}
