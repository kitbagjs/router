import { IS_TAGS_SYMBOL, TagGroup, TagLayer, LinkTag, LinkTagSelector, MetaTag, MetaTagSelector, TagOperation, TagSelector, Tags, TagsInternal } from '@/types/tags'
import { mergeTags } from '@/utilities/mergeTags'
import { copyTag } from '@/utilities/copyTag'
import { toResolvedTags } from '@/utilities/toResolvedTags'

function createSelector<TTag extends TagSelector['tag']>(tag: TTag, attributes: Record<string, string>): TagSelector & { tag: TTag } {
  return { tag, attributes }
}

function metaSelector({ name, property, media, key, id }: MetaTagSelector, exact: boolean): TagSelector & { tag: 'meta' } {
  const attributes: Record<string, string> = {}

  if (property === undefined) {
    attributes.name = name
  } else {
    attributes.property = property
  }

  if (key !== undefined) {
    attributes.key = key
  }

  if (media !== undefined) {
    attributes.media = media
  } else if (exact) {
    attributes.media = ''
  }

  if (id !== undefined) {
    attributes.id = id
  }

  return createSelector('meta', attributes)
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
 * Supplies a fresh callback scope. Reads include only its local writes.
 * Internal operations contain only this scope's writes for navigation storage.
 */
export function createTags(): Tags {
  const operations: TagOperation[] = []

  function record(operation: TagOperation): void {
    operations.push(operation)
  }

  function readGroups(): readonly TagGroup[] {
    return mergeTags([operations])
  }

  const get: Tags['get'] = async () => {
    const groups = readGroups()

    return toResolvedTags(groups)
  }

  function writeMeta(kind: 'set' | 'add', descriptor: MetaTag): void {
    const selector = metaSelector(descriptor, true)
    const target = metaSelector(descriptor, descriptor.key === undefined)
    const group: TagGroup = { ...selector, value: copyTag(descriptor) }

    record({ kind, target, groups: [group] })
  }

  function writeLink(kind: 'set' | 'add', descriptor: LinkTag): void {
    const target = linkSelector(descriptor, true)
    const group: TagGroup = { ...target, value: copyTag(descriptor) }

    record({ kind, target, groups: [group] })
  }

  const getTitle: Tags['title']['get'] = async () => {
    const resolved = await get()

    return resolved.title
  }

  const setTitle: Tags['title']['set'] = (value) => {
    const target = createSelector('title', {})
    const group: TagGroup = { ...target, value }

    record({ kind: 'set', target, groups: [group] })
  }

  const deleteTitle: Tags['title']['delete'] = () => {
    const target = createSelector('title', {})

    record({ kind: 'delete', target })
  }

  const getMeta: Tags['meta']['get'] = async (selector) => {
    const groups = readGroups()
    const resolved = toResolvedTags(groups)

    return resolved.meta.get(selector)
  }

  const setMeta: Tags['meta']['set'] = (descriptor) => writeMeta('set', descriptor)

  const addMeta: Tags['meta']['add'] = (descriptor) => writeMeta('add', descriptor)

  const deleteMeta: Tags['meta']['delete'] = (selector) => {
    const target = metaSelector(selector, false)

    record({ kind: 'delete', target })
  }

  const getLink: Tags['link']['get'] = async (selector) => {
    const groups = readGroups()
    const resolved = toResolvedTags(groups)

    return resolved.link.get(selector)
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

  const tags = {
    [IS_TAGS_SYMBOL]: true,
    get operations(): TagLayer {
      return [...operations]
    },
    get,
    title,
    meta,
    link,
  } satisfies Tags & TagsInternal

  return tags
}
