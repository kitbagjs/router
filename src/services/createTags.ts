import { TagGroup, TagLayer, LinkTag, LinkTagSelector, MetaTag, MetaTagSelector, TagOperation, TagSelector, Tags, ResolvedMetaTag, ResolvedLinkTag } from '@/types/tags'
import { MaybePromise } from '@/types/utilities'
import { matchesTag, mergeTags } from '@/services/mergeTags'

type CreateTagsOptions = {
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
 * Supplies a fresh callback scope. Reads include ancestor layers and local writes; the internal
 * layer getter snapshots only this scope's operations for navigation storage.
 */
export function createTags({ getParentLayers = () => [] }: CreateTagsOptions = {}): Tags & { readonly layer: TagLayer } {
  const operations: TagOperation[] = []

  function record(operation: TagOperation): void {
    operations.push(Object.freeze(operation))
  }

  async function readGroups(): Promise<readonly TagGroup[]> {
    // Capture local writes before awaiting ancestors; later writes belong to the next read.
    const local = Object.freeze([...operations])
    const parents = await getParentLayers()

    return mergeTags([...parents, local])
  }

  const get: Tags['get'] = async () => {
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

  const getTitle: Tags['title']['get'] = async () => {
    const snapshot = await get()

    return snapshot.title
  }

  const setTitle: Tags['title']['set'] = (value) => {
    const target = createSelector('title', {})
    const group: TagGroup = Object.freeze({ ...target, value })

    record({ kind: 'set', target, groups: Object.freeze([group]) })
  }

  const deleteTitle: Tags['title']['delete'] = () => {
    const target = createSelector('title', {})

    record({ kind: 'delete', target })
  }

  const getMeta: Tags['meta']['get'] = async (selector) => {
    const target = selector === undefined ? undefined : metaSelector(selector, false)
    const groups = await readGroups()
    const values = groups.flatMap((group) => {
      if (group.tag === 'meta' && (!target || matchesTag(group, target))) {
        return [copyMeta(group.value)]
      }

      return []
    })

    return Object.freeze(values)
  }

  const setMeta: Tags['meta']['set'] = (descriptor) => writeMeta('set', descriptor)

  const addMeta: Tags['meta']['add'] = (descriptor) => writeMeta('add', descriptor)

  const deleteMeta: Tags['meta']['delete'] = (selector) => {
    const target = metaSelector(selector, false)

    record({ kind: 'delete', target })
  }

  const getLink: Tags['link']['get'] = async (selector) => {
    const target = selector === undefined ? undefined : linkSelector(selector, false)
    const groups = await readGroups()
    const values = groups.flatMap((group) => {
      if (group.tag === 'link' && (!target || matchesTag(group, target))) {
        return [copyLink(group.value)]
      }

      return []
    })

    return Object.freeze(values)
  }

  const setLink: Tags['link']['set'] = (descriptor) => writeLink('set', descriptor)

  const addLink: Tags['link']['add'] = (descriptor) => writeLink('add', descriptor)

  const deleteLink: Tags['link']['delete'] = (selector) => {
    const target = linkSelector(selector, false)

    record({ kind: 'delete', target })
  }

  const title: Tags['title'] = {
    get: getTitle,
    set: setTitle,
    delete: deleteTitle,
  }

  const meta: Tags['meta'] = {
    get: getMeta,
    set: setMeta,
    add: addMeta,
    delete: deleteMeta,
  }

  const link: Tags['link'] = {
    get: getLink,
    set: setLink,
    add: addLink,
    delete: deleteLink,
  }

  const getLayer = (): TagLayer => Object.freeze([...operations])

  const tags = {
    get,
    get layer() {
      return getLayer()
    },
    title,
    meta,
    link,
  }

  return tags
}
