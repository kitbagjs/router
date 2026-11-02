import { assert, describe, expect, test } from 'vitest'
import { createTags } from '@/services/createTags'
import { toTagLayer } from '@/services/toTagLayer'
import { mergeTags } from '@/services/mergeTags'
import { flattenTags } from '@/services/flattenTags'
import { TagElement, TagLayer, MetaTag, Tags } from '@/types/tags'

function layer(callback: (tags: Tags) => void): TagLayer {
  const tags = createTags()

  callback(tags)

  return toTagLayer(tags)
}

function image(url: string, alt?: string): MetaTag {
  const related: MetaTag[] = []

  if (alt !== undefined) {
    related.push({
      property: 'og:image:alt',
      content: alt,
    })
  }

  return {
    property: 'og:image',
    content: url,
    related,
  }
}

function elements(...layers: TagLayer[]): readonly TagElement[] {
  return flattenTags(mergeTags(layers))
}

function contents(...layers: TagLayer[]): (string | undefined)[] {
  return elements(...layers).map((element) => element.textContent ?? element.attributes.content ?? element.attributes.href)
}

describe('createTags', () => {
  test('overrides one theme-color variant and can delete every variant', () => {
    const parent = layer((tags) => {
      tags.meta.add({
        name: 'theme-color',
        content: 'white',
        media: '(prefers-color-scheme: light)',
      })
      tags.meta.add({
        name: 'theme-color',
        content: 'black',
        media: '(prefers-color-scheme: dark)',
      })
    })
    const child = layer((tags) => tags.meta.set({
      name: 'theme-color',
      content: 'navy',
      media: '(prefers-color-scheme: dark)',
    }))
    const deleted = layer((tags) => tags.meta.delete({ name: 'theme-color' }))
    const darkDeleted = layer((tags) => tags.meta.delete({
      name: 'theme-color',
      media: '(prefers-color-scheme: dark)',
    }))

    expect(contents(parent, child)).toEqual(['white', 'navy'])
    expect(contents(parent, child, deleted)).toEqual([])
    expect(contents(parent, child, darkDeleted)).toEqual(['white'])
  })

  test('an explicit key replaces a selected group without becoming an HTML attribute', () => {
    const parent = layer((tags) => {
      tags.meta.add({ ...image('/wide.jpg', 'Wide'), key: 'wide' })
      tags.meta.add({ ...image('/square.jpg', 'Square'), key: 'square' })
    })
    const child = layer((tags) => tags.meta.set({ ...image('/new-wide.jpg'), key: 'wide' }))
    const replacement = layer((tags) => tags.meta.set(image('/all.jpg')))

    expect(contents(parent, child)).toEqual(['/square.jpg', 'Square', '/new-wide.jpg'])
    expect(contents(parent, replacement)).toEqual(['/all.jpg'])
    expect(elements(parent, child).every((element) => !('key' in element.attributes))).toBe(true)
  })

  test('distinguishes name from property and accepts arbitrary values for either', () => {
    const parent = layer((tags) => {
      tags.meta.set({
        name: 'custom:field',
        content: 'Named',
      })
      tags.meta.set({
        property: 'custom:field',
        content: 'Property',
      })
      tags.meta.set({
        name: 'twitter:card',
        content: 'summary',
      })
    })
    const child = layer((tags) => tags.meta.delete({ property: 'custom:field' }))

    expect(contents(parent, child)).toEqual(['Named', 'summary'])
    expect(elements(parent)[2].attributes.name).toBe('twitter:card')
  })

  test('canonical links replace by relation regardless of href or key', () => {
    const parent = layer((tags) => tags.link.set({
      rel: 'canonical',
      href: '/parent',
      key: 'parent',
    }))
    const child = layer((tags) => tags.link.set({
      rel: 'canonical',
      href: '/child',
      key: 'child',
    }))

    expect(contents(parent, child)).toEqual(['/child'])
  })

  test('language alternates replace only the matching language', () => {
    const parent = layer((tags) => {
      tags.link.add({
        rel: 'alternate',
        hreflang: 'en',
        href: '/en',
      })
      tags.link.add({
        rel: 'alternate',
        hreflang: 'es',
        href: '/es',
      })
    })
    const child = layer((tags) => tags.link.set({
      rel: 'alternate',
      hreflang: 'es',
      href: '/es/product',
    }))

    expect(contents(parent, child)).toEqual(['/en', '/es/product'])
  })

  test('icons coexist by size, format, and media; matching variants replace', () => {
    const parent = layer((tags) => {
      tags.link.add({
        rel: 'icon',
        href: '/small.png',
        sizes: '16x16',
        type: 'image/png',
      })
      tags.link.add({
        rel: 'icon',
        href: '/dark.svg',
        type: 'image/svg+xml',
        media: '(prefers-color-scheme: dark)',
      })
    })
    const child = layer((tags) => tags.link.set({
      rel: 'icon',
      href: '/unread.svg',
      type: 'image/svg+xml',
      media: '(prefers-color-scheme: dark)',
    }))
    const deleted = layer((tags) => tags.link.delete({ rel: 'icon' }))

    expect(contents(parent, child)).toEqual(['/small.png', '/unread.svg'])
    expect(contents(parent, child, deleted)).toEqual([])
  })

  test('generic links coexist by href and can be explicitly keyed', () => {
    const parent = layer((tags) => {
      tags.link.add({
        rel: 'preconnect',
        href: 'https://first.example.com',
      })
      tags.link.add({
        rel: 'preconnect',
        href: 'https://second.example.com',
        key: 'api',
      })
    })
    const child = layer((tags) => tags.link.set({
      rel: 'preconnect',
      href: 'https://new.example.com',
      key: 'api',
      crossorigin: 'anonymous',
    }))

    expect(contents(parent, child)).toEqual(['https://first.example.com', 'https://new.example.com'])
    expect(elements(parent, child)[1].attributes).toEqual({
      rel: 'preconnect',
      href: 'https://new.example.com',
      crossorigin: 'anonymous',
    })
  })

  test('deleting a link variant retains other links', () => {
    const parent = layer((tags) => {
      tags.link.add({
        rel: 'icon',
        href: '/small.png',
        sizes: '16x16',
      })
      tags.link.add({
        rel: 'icon',
        href: '/large.png',
        sizes: '32x32',
      })
    })
    const child = layer((tags) => tags.link.delete({
      rel: 'icon',
      sizes: '16x16',
    }))

    expect(contents(parent, child)).toEqual(['/large.png'])
  })

  test('deletion can match attributes beyond the default identity', () => {
    const parent = layer((tags) => tags.link.set({
      rel: 'canonical',
      href: '/product',
    }))
    const other = layer((tags) => tags.link.delete({
      rel: 'canonical',
      href: '/other',
    }))
    const matching = layer((tags) => tags.link.delete({
      rel: 'canonical',
      href: '/product',
    }))

    expect(contents(parent, other)).toEqual(['/product'])
    expect(contents(parent, matching)).toEqual([])
  })

  test('omits explicitly undefined optional attributes and selector fields', () => {
    const parent = layer((tags) => tags.link.set({
      rel: 'icon',
      href: '/icon.svg',
      media: undefined,
    }))
    const child = layer((tags) => tags.link.delete({
      rel: 'icon',
      media: undefined,
    }))

    expect(elements(parent)[0].attributes).toEqual({
      rel: 'icon',
      href: '/icon.svg',
    })
    expect(contents(parent, child)).toEqual([])
  })

  test('related links use the same ownership and ordering as related metadata', () => {
    const parent = layer((tags) => tags.link.add({
      rel: 'alternate',
      hreflang: 'en',
      href: '/en',
      related: [{
        rel: 'alternate',
        hreflang: 'es',
        href: '/es',
      }],
    }))
    const child = layer((tags) => tags.link.delete({
      rel: 'alternate',
      hreflang: 'en',
    }))

    expect(contents(parent)).toEqual(['/en', '/es'])
    expect(contents(parent, child)).toEqual([])
  })

  test('copies related descriptors before their owner can change them', () => {
    const descriptor = {
      property: 'og:image',
      content: '/original.jpg',
      related: [{
        property: 'og:image:alt',
        content: 'Original',
      }],
    }
    const value = layer((tags) => {
      tags.meta.set(descriptor)
      descriptor.content = '/changed.jpg'
      descriptor.related[0].content = 'Changed'
      descriptor.related.push({
        property: 'og:image:width',
        content: '1200',
      })
    })

    expect(contents(value)).toEqual(['/original.jpg', 'Original'])
  })

  test('returns empty values when no layer contributes tags', async () => {
    const tags = createTags()

    await expect(tags.get()).resolves.toEqual({
      title: undefined,
      meta: [],
      link: [],
    })
    await expect(tags.title.get()).resolves.toBeUndefined()
    await expect(tags.meta.get()).resolves.toEqual([])
    await expect(tags.link.get()).resolves.toEqual([])
  })

  test('combines inherited values with local writes, additions, and deletions', async () => {
    const parent = layer((tags) => {
      tags.title.set('Store')
      tags.meta.add(image('/parent.jpg', 'Parent'))
      tags.meta.set({
        name: 'description',
        content: 'Parent description',
      })
      tags.link.set({
        rel: 'canonical',
        href: '/store',
      })
    })
    const tags = createTags({ getParentLayers: () => [parent] })

    await expect(tags.title.get()).resolves.toBe('Store')

    tags.title.set('Product')
    tags.meta.add(image('/child.jpg', 'Child'))
    tags.meta.delete({ name: 'description' })
    tags.link.set({
      rel: 'canonical',
      href: '/product',
    })

    await expect(tags.title.get()).resolves.toBe('Product')
    await expect(tags.meta.get({ property: 'og:image' })).resolves.toEqual([
      image('/parent.jpg', 'Parent'),
      image('/child.jpg', 'Child'),
    ])
    await expect(tags.meta.get({ name: 'description' })).resolves.toEqual([])
    await expect(tags.link.get({ rel: 'canonical' })).resolves.toEqual([{
      rel: 'canonical',
      href: '/product',
    }])
    await expect(tags.get()).resolves.toEqual({
      title: 'Product',
      meta: [image('/parent.jpg', 'Parent'), image('/child.jpg', 'Child')],
      link: [{
        rel: 'canonical',
        href: '/product',
      }],
    })
  })

  test('awaits inherited computations and reads only local writes made before the call', async () => {
    const pending = Promise.withResolvers<readonly TagLayer[]>()
    const parent = layer((tags) => tags.title.set('Parent'))
    const tags = createTags({ getParentLayers: () => pending.promise })
    const beforeWrite = tags.title.get()

    tags.title.set('Local')

    pending.resolve([parent])

    await expect(beforeWrite).resolves.toBe('Parent')
    await expect(tags.title.get()).resolves.toBe('Local')
  })

  test('does not resolve ancestors for a write-only callback', () => {
    let reads = 0
    const tags = createTags({
      getParentLayers: () => {
        reads++
        return []
      },
    })

    tags.title.set('Local')

    expect(contents(toTagLayer(tags))).toEqual(['Local'])
    expect(reads).toBe(0)
  })

  test('captures selectors before awaiting inherited values', async () => {
    const pending = Promise.withResolvers<readonly TagLayer[]>()
    const parent = layer((tags) => {
      tags.meta.add({
        name: 'description',
        content: 'Description',
      })
      tags.link.add({
        rel: 'icon',
        href: '/icon.svg',
      })
    })
    const tags = createTags({ getParentLayers: () => pending.promise })
    const metaSelector = { name: 'description' }
    const linkSelector = { rel: 'icon' }
    const metadata = tags.meta.get(metaSelector)
    const links = tags.link.get(linkSelector)

    metaSelector.name = 'author'
    linkSelector.rel = 'canonical'
    pending.resolve([parent])

    await expect(metadata).resolves.toEqual([{
      name: 'description',
      content: 'Description',
    }])
    await expect(links).resolves.toEqual([{
      rel: 'icon',
      href: '/icon.svg',
    }])
  })

  test('reads the current supplied ancestor layers without retaining a previous snapshot', async () => {
    let parent = layer((tags) => tags.title.set('Original'))
    const tags = createTags({ getParentLayers: () => [parent] })
    const original = await tags.get()

    parent = layer((tags) => tags.title.set('Updated'))

    await expect(tags.title.get()).resolves.toBe('Updated')
    expect(original.title).toBe('Original')
  })

  test('copies descriptor trees when reading hydrated layers', async () => {
    const descriptor: MetaTag = {
      property: 'custom:item',
      content: 'Item',
      related: [{
        property: 'custom:detail',
        content: 'Detail',
        related: [{
          name: 'label',
          content: 'Label',
        }],
      }],
    }
    const parent = layer((tags) => tags.meta.add(descriptor))
    const hydrated: TagLayer = JSON.parse(JSON.stringify(parent))
    const tags = createTags({ getParentLayers: () => [hydrated] })
    const snapshot = await tags.get()
    const related = snapshot.meta[0].related ?? []
    const grandchild = related[0]?.related?.[0]

    assert(grandchild)

    expect(snapshot.meta).toEqual([descriptor])
    Reflect.set(grandchild, 'content', 'Changed')
    Reflect.set(related, '0', {})
    Reflect.set(snapshot.meta, '0', {})
    Reflect.set(snapshot, 'title', 'Changed')
    expect(mergeTags([hydrated])[0]).toEqual(mergeTags([parent])[0])
    await expect(tags.meta.get()).resolves.toEqual([descriptor])
  })

  test('filters primary entries without detaching related tags', async () => {
    const parent = layer((tags) => {
      tags.meta.add({ ...image('/wide.jpg', 'Wide'), key: 'wide' })
      tags.meta.add({ ...image('/square.jpg', 'Square'), key: 'square' })
      tags.link.add({
        rel: 'icon',
        href: '/small.png',
        sizes: '16x16',
      })
      tags.link.add({
        rel: 'icon',
        href: '/large.png',
        sizes: '32x32',
      })
    })
    const tags = createTags({ getParentLayers: () => [parent] })

    await expect(tags.meta.get({ property: 'og:image', key: 'square' })).resolves.toEqual([
      { ...image('/square.jpg', 'Square'), key: 'square' },
    ])
    await expect(tags.meta.get({ property: 'og:image:alt' })).resolves.toEqual([])
    await expect(tags.link.get({ rel: 'icon', sizes: '32x32' })).resolves.toEqual([{
      rel: 'icon',
      href: '/large.png',
      sizes: '32x32',
    }])
  })

  test('a fresh evaluation does not inherit the previous evaluation of its own scope', async () => {
    const parent = layer((tags) => tags.title.set('Parent'))
    const previous = createTags({ getParentLayers: () => [parent] })

    previous.title.set('Previous local')

    expect(contents(toTagLayer(previous))).toEqual(['Previous local'])

    const current = createTags({ getParentLayers: () => [parent] })

    await expect(current.title.get()).resolves.toBe('Parent')
  })

  test('propagates failed ancestor reads without changing local operations', async () => {
    const error = new Error('Parent failed')
    const tags = createTags({ getParentLayers: () => Promise.reject(error) })

    tags.title.set('Local')

    await expect(tags.title.get()).rejects.toBe(error)
    expect(contents(toTagLayer(tags))).toEqual(['Local'])
  })
})
