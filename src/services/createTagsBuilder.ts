import { TagElement, TagGroup, TagLayer, LinkTag, LinkTagSelector, MetaTag, MetaTagSelector, TagOperation, TagSelector, Tags } from '@/types/tags'

function createSelector(tag: TagSelector['tag'], attributes: Record<string, string>): TagSelector {
  return Object.freeze({ tag, attributes: Object.freeze(attributes) })
}

function createElement(tag: TagElement['tag'], attributes: Record<string, string>, textContent?: string): TagElement {
  return Object.freeze({
    tag,
    attributes: Object.freeze(attributes),
    ...textContent === undefined ? {} : { textContent },
  })
}

function createGroup(selector: TagSelector, elements: TagElement[]): TagGroup {
  return Object.freeze({ selector, elements: Object.freeze(elements) })
}

function attributesOf(value: object): Record<string, string> {
  const attributes: Record<string, string> = {}

  for (const [name, content] of Object.entries(value)) {
    if (name === 'key' || name === 'related') {
      continue
    }

    if (typeof content === 'string' || typeof content === 'number' || typeof content === 'boolean') {
      attributes[name] = String(content)
    }
  }

  return attributes
}

function relatedElements<T extends { related?: readonly T[] }>(tag: TagElement['tag'], value: T): TagElement[] {
  return [
    createElement(tag, attributesOf(value)),
    ...value.related?.flatMap((related) => relatedElements(tag, related)) ?? [],
  ]
}

function metaSelector({ name, property, media, key, id }: MetaTagSelector, exact: boolean): TagSelector {
  const identifier: Record<string, string> = property === undefined ? { name } : { property }

  return createSelector('meta', {
    ...identifier,
    ...key === undefined ? {} : { key },
    ...exact || media !== undefined ? { media: media ?? '' } : {},
    ...id === undefined ? {} : { id },
  })
}

function linkSelector(value: LinkTagSelector, exact: boolean): TagSelector {
  const { rel, key, type, sizes, media, hreflang, href } = value

  if (!exact) {
    const attributes = attributesOf(value)

    if (key !== undefined) {
      attributes.key = key
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
 * Supplies the callback's tags and retains its operations without reading any parent layer.
 * Finish after the callback settles to seal the serializable layer and reject late writes.
 */
export function createTagsBuilder(): { tags: Tags, finish: () => TagLayer } {
  const operations: TagOperation[] = []
  let finished = false

  function record(operation: TagOperation): void {
    if (finished) {
      throw new Error('Cannot modify a finished tag layer')
    }

    operations.push(Object.freeze(operation))
  }

  function writeMeta(kind: 'set' | 'add', descriptor: MetaTag): void {
    const selector = metaSelector(descriptor, true)
    const target = metaSelector(descriptor, descriptor.key === undefined)
    const group = createGroup(selector, relatedElements('meta', descriptor))

    record({ kind, target, groups: Object.freeze([group]) })
  }

  function writeLink(kind: 'set' | 'add', descriptor: LinkTag): void {
    const target = linkSelector(descriptor, true)
    const group = createGroup(target, relatedElements('link', descriptor))

    record({ kind, target, groups: Object.freeze([group]) })
  }

  const tags: Tags = {
    title: {
      set: (value) => {
        const target = createSelector('title', {})
        const group = createGroup(target, [createElement('title', {}, value)])

        record({ kind: 'set', target, groups: Object.freeze([group]) })
      },
      delete: () => record({ kind: 'delete', target: createSelector('title', {}) }),
    },
    meta: {
      set: (descriptor) => writeMeta('set', descriptor),
      add: (descriptor) => writeMeta('add', descriptor),
      delete: (selector) => record({ kind: 'delete', target: metaSelector(selector, false) }),
    },
    link: {
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
