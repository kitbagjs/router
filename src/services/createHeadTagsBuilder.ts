import { HeadElement, HeadGroup, HeadImage, HeadLayer, HeadLink, HeadLinkSelector, HeadMetaContent, HeadMetaDescriptor, HeadMetaIdentifier, HeadMetaMethod, HeadMetaSelector, HeadOperation, HeadSelector, HeadTags } from '@/types/headTags'

type MetaValue = string | HeadImage | HeadMetaContent

const PROPERTY_PREFIXES = ['og:', 'article:', 'book:', 'profile:', 'music:', 'video:']
const MEDIA_NAMES = ['og:image', 'og:video', 'og:audio']
const MEDIA_PROPERTIES = {
  secureUrl: 'secure_url',
  type: 'type',
  alt: 'alt',
  width: 'width',
  height: 'height',
} as const

function createSelector(tag: HeadSelector['tag'], attributes: Record<string, string>): HeadSelector {
  return Object.freeze({ tag, attributes: Object.freeze(attributes) })
}

function createElement(tag: HeadElement['tag'], attributes: Record<string, string>, textContent?: string): HeadElement {
  return Object.freeze({
    tag,
    attributes: Object.freeze(attributes),
    ...textContent === undefined ? {} : { textContent },
  })
}

function createGroup(selector: HeadSelector, elements: HeadElement[]): HeadGroup {
  return Object.freeze({ selector, elements: Object.freeze(elements) })
}

function metaIdentifier(name: string): Record<string, string> {
  return PROPERTY_PREFIXES.some((prefix) => name.startsWith(prefix)) ? { property: name } : { name }
}

function metaSelector(identifier: Record<string, string>, { media, key }: HeadMetaSelector, exact: boolean): HeadSelector {
  const matchesMedia = key === undefined && (exact || media !== undefined)

  return createSelector('meta', {
    ...identifier,
    ...key === undefined ? {} : { key },
    ...matchesMedia ? { media: media ?? '' } : {},
  })
}

function metaGroup(name: string, value: MetaValue): HeadGroup {
  const identifier = metaIdentifier(name)

  if (typeof value === 'object' && 'url' in value) {
    const elements = [createElement('meta', { ...identifier, content: value.url })]

    for (const [property, attribute] of Object.entries(MEDIA_PROPERTIES)) {
      const content = value[property as keyof typeof MEDIA_PROPERTIES]

      if (content !== undefined) {
        elements.push(createElement('meta', { property: `${name}:${attribute}`, content: String(content) }))
      }
    }

    return createGroup(metaSelector(identifier, value, false), elements)
  }

  const descriptor = typeof value === 'string' ? { content: value } : value
  const { content, media } = descriptor
  const selector = metaSelector(identifier, descriptor, !MEDIA_NAMES.includes(name))

  return createGroup(selector, [createElement('meta', {
    ...identifier,
    content,
    ...media === undefined ? {} : { media },
  })])
}

function descriptorGroup({ name, property, content, media, key }: HeadMetaDescriptor): HeadGroup {
  const identifier: Record<string, string> = property === undefined ? { name } : { property }
  const selector = metaSelector(identifier, { media, key }, property === undefined || !MEDIA_NAMES.includes(property))

  return createGroup(selector, [createElement('meta', {
    ...identifier,
    content,
    ...media === undefined ? {} : { media },
  })])
}

function linkSelector(value: HeadLinkSelector, exact: boolean): HeadSelector {
  const { rel, key, type, sizes, media, hreflang, href } = value

  if (!exact) {
    const attributes: Record<string, string> = { rel }

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

function linkGroup(value: HeadLink): HeadGroup {
  const attributes: Record<string, string> = {}

  for (const [name, content] of Object.entries<string | undefined>(value)) {
    if (name !== 'key' && content !== undefined) {
      attributes[name] = content
    }
  }

  const selector = linkSelector(value, true)

  return createGroup(selector, [createElement('link', attributes)])
}

/**
 * Supplies the callback's tags and retains its operations without reading any parent layer.
 * Finish after the callback settles to seal the serializable layer and reject late writes.
 */
export function createHeadTagsBuilder(): { tags: HeadTags, finish: () => HeadLayer } {
  const operations: HeadOperation[] = []
  let finished = false

  function record(operation: HeadOperation): void {
    if (finished) {
      throw new Error('Cannot modify a finished head tag layer')
    }

    operations.push(Object.freeze(operation))
  }

  function write(kind: 'set' | 'add', groups: HeadGroup[]): void {
    const target = groups.at(0)?.selector

    if (!target) {
      return
    }

    // Clear all addressed variants before appending so a collection retains its declared order.
    if (kind === 'set' && groups.length > 1) {
      for (const group of groups) {
        record({ kind: 'delete', target: group.selector })
      }

      record({ kind: 'add', target, groups: Object.freeze(groups) })
      return
    }

    record({ kind, target, groups: Object.freeze(groups) })
  }

  function metaMethod(kind: 'set' | 'add'): HeadMetaMethod {
    return (nameOrDescriptor: string | HeadMetaDescriptor, value?: MetaValue | readonly MetaValue[]): void => {
      if (typeof nameOrDescriptor !== 'string') {
        write(kind, [descriptorGroup(nameOrDescriptor)])
        return
      }

      const values: readonly MetaValue[] = value === undefined ? [] : Array.isArray(value) ? value : [value]
      const groups = values.map((item) => metaGroup(nameOrDescriptor, item))

      if (groups.length === 0 && kind === 'set') {
        record({ kind: 'delete', target: metaSelector(metaIdentifier(nameOrDescriptor), {}, false) })
        return
      }

      write(kind, groups)
    }
  }

  const tags: HeadTags = {
    title: {
      set: (value) => {
        const selector = createSelector('title', {})

        write('set', [createGroup(selector, [createElement('title', {}, value)])])
      },
      delete: () => record({ kind: 'delete', target: createSelector('title', {}) }),
    },
    meta: {
      set: metaMethod('set'),
      add: metaMethod('add'),
      delete: (nameOrSelector: string | HeadMetaIdentifier & HeadMetaSelector, selector: HeadMetaSelector = {}) => {
        if (typeof nameOrSelector === 'string') {
          record({ kind: 'delete', target: metaSelector(metaIdentifier(nameOrSelector), selector, false) })
          return
        }

        const { name, property, ...options } = nameOrSelector
        const identifier: Record<string, string> = property === undefined ? { name } : { property }

        record({ kind: 'delete', target: metaSelector(identifier, options, false) })
      },
    },
    link: {
      set: (value) => write('set', [linkGroup(value)]),
      add: (value) => write('add', [linkGroup(value)]),
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
