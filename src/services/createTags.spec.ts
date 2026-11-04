import { assert, expect, test, vi } from 'vitest'
import { createTags } from '@/services/createTags'
import { TagLayer, MetaTag, LinkTag, Tags, isTags } from '@/types/tags'

function layer(callback: (tags: Tags) => void): TagLayer {
  const tags = createTags()

  callback(tags)
  assert(isTags(tags))

  return tags.operations
}

test('records title writes and deletions in order, including an empty title', () => {
  const operations = layer((tags) => {
    tags.title.set('')
    tags.title.delete()
  })

  expect(operations).toEqual([
    { kind: 'set', target: { tag: 'title', attributes: {} }, groups: [{ tag: 'title', attributes: {}, value: '' }] },
    { kind: 'delete', target: { tag: 'title', attributes: {} } },
  ])
})

test.each<{
  name: string,
  descriptor: MetaTag,
  attributes: Record<string, string>,
  target: Record<string, string>,
}>([
  {
    name: 'named metadata',
    descriptor: { name: 'custom:field', content: 'Named' },
    attributes: { name: 'custom:field', media: '' },
    target: { name: 'custom:field', media: '' },
  },
  {
    name: 'property metadata',
    descriptor: { property: 'custom:field', content: 'Property' },
    attributes: { property: 'custom:field', media: '' },
    target: { property: 'custom:field', media: '' },
  },
  {
    name: 'media variants',
    descriptor: { name: 'theme-color', content: 'black', media: 'dark' },
    attributes: { name: 'theme-color', media: 'dark' },
    target: { name: 'theme-color', media: 'dark' },
  },
  {
    name: 'explicit metadata keys',
    descriptor: { property: 'og:image', content: '/wide.jpg', key: 'wide' },
    attributes: { property: 'og:image', key: 'wide', media: '' },
    target: { property: 'og:image', key: 'wide' },
  },
  {
    name: 'metadata ids',
    descriptor: { name: 'description', content: 'Product', id: 'summary' },
    attributes: { name: 'description', id: 'summary', media: '' },
    target: { name: 'description', id: 'summary', media: '' },
  },
])('records the identity of $name', ({ descriptor, attributes, target }) => {
  const operations = layer((tags) => {
    tags.meta.set(descriptor)
    tags.meta.add(descriptor)
  })
  const group = { tag: 'meta', attributes, value: descriptor }

  expect(operations).toEqual([
    { kind: 'set', target: { tag: 'meta', attributes: target }, groups: [group] },
    { kind: 'add', target: { tag: 'meta', attributes: target }, groups: [group] },
  ])
})

test('metadata deletion constrains only supplied selector fields', () => {
  const operations = layer((tags) => {
    tags.meta.delete({ name: 'theme-color', media: undefined })
    tags.meta.delete({ name: 'theme-color', media: 'dark' })
  })

  expect(operations).toEqual([
    { kind: 'delete', target: { tag: 'meta', attributes: { name: 'theme-color' } } },
    { kind: 'delete', target: { tag: 'meta', attributes: { name: 'theme-color', media: 'dark' } } },
  ])
})

test.each<{
  name: string,
  descriptor: LinkTag,
  attributes: Record<string, string>,
}>([
  {
    name: 'canonical links',
    descriptor: { rel: 'canonical', href: '/product', key: 'ignored' },
    attributes: { rel: 'canonical' },
  },
  {
    name: 'language alternates',
    descriptor: { rel: 'alternate', href: '/es', hreflang: 'es', key: 'ignored' },
    attributes: { rel: 'alternate', hreflang: 'es' },
  },
  {
    name: 'sized icons',
    descriptor: { rel: 'icon', href: '/small.png', sizes: '16x16', type: 'image/png' },
    attributes: { rel: 'icon', sizes: '16x16', type: 'image/png', media: '' },
  },
  {
    name: 'touch icons',
    descriptor: { rel: 'apple-touch-icon', href: '/touch.png' },
    attributes: { rel: 'apple-touch-icon', sizes: '', type: '', media: '' },
  },
  {
    name: 'mask icons',
    descriptor: { rel: 'mask-icon', href: '/mask.svg', media: 'dark' },
    attributes: { rel: 'mask-icon', sizes: '', type: '', media: 'dark' },
  },
  {
    name: 'explicit link keys',
    descriptor: { rel: 'preconnect', href: 'https://api.example.com', key: 'api' },
    attributes: { rel: 'preconnect', key: 'api' },
  },
  {
    name: 'generic link destinations',
    descriptor: { rel: 'preconnect', href: 'https://api.example.com' },
    attributes: { rel: 'preconnect', href: 'https://api.example.com' },
  },
])('records the identity of $name', ({ descriptor, attributes }) => {
  const operations = layer((tags) => {
    tags.link.set(descriptor)
    tags.link.add(descriptor)
  })
  const target = { tag: 'link', attributes }
  const group = { ...target, value: descriptor }

  expect(operations).toEqual([
    { kind: 'set', target, groups: [group] },
    { kind: 'add', target, groups: [group] },
  ])
})

test('link deletion retains explicit filters beyond the default identity', () => {
  const operations = layer((tags) => {
    tags.link.delete({ rel: 'canonical', href: '/product', media: undefined })
    tags.link.delete({ rel: 'icon' })
  })

  expect(operations).toEqual([
    { kind: 'delete', target: { tag: 'link', attributes: { rel: 'canonical', href: '/product' } } },
    { kind: 'delete', target: { tag: 'link', attributes: { rel: 'icon' } } },
  ])
})

test('copies metadata and its related descriptors when recording a write', () => {
  const descriptor = {
    property: 'og:image',
    content: '/original.jpg',
    related: [{ property: 'og:image:alt', content: 'Original' }],
  }
  const operations = layer((tags) => tags.meta.set(descriptor))

  descriptor.content = '/changed.jpg'
  descriptor.related[0].content = 'Changed'
  descriptor.related.push({ property: 'og:image:width', content: '1200' })

  expect(operations).toMatchObject([{
    groups: [{ value: { property: 'og:image', content: '/original.jpg', related: [{ property: 'og:image:alt', content: 'Original' }] } }],
  }])
})

test('copies links and their related descriptors when recording a write', () => {
  const descriptor = { rel: 'alternate', href: '/en', related: [{ rel: 'alternate', href: '/es' }] }
  const operations = layer((tags) => tags.link.add(descriptor))

  descriptor.href = '/changed'
  descriptor.related[0].href = '/changed-related'

  expect(operations).toMatchObject([{
    groups: [{ value: { rel: 'alternate', href: '/en', related: [{ rel: 'alternate', href: '/es' }] } }],
  }])
})

test('get returns title, metadata, and links in their snapshot fields', async () => {
  const tags = createTags()
  tags.title.set('Product')
  tags.meta.set({ name: 'description', content: 'Product details' })
  tags.link.set({ rel: 'canonical', href: '/product' })

  await expect(tags.get()).resolves.toEqual({
    title: 'Product',
    meta: [{ name: 'description', content: 'Product details' }],
    link: [{ rel: 'canonical', href: '/product' }],
  })
})

test('reads inherited tags with local changes without storing the inherited operations', async () => {
  const parent = layer((tags) => {
    tags.title.set('Parent')
    tags.meta.set({ name: 'description', content: 'Parent description' })
  })
  const tags = createTags({ getParentLayers: () => [parent] })
  tags.meta.delete({ name: 'description' })

  await expect(tags.get()).resolves.toEqual({ title: 'Parent', meta: [], link: [] })
  assert(isTags(tags))
  expect(tags.operations).toEqual([{ kind: 'delete', target: { tag: 'meta', attributes: { name: 'description' } } }])
})

test('captures local writes before awaiting inherited values', async () => {
  const pending = Promise.withResolvers<readonly TagLayer[]>()
  const parent = layer((tags) => tags.title.set('Parent'))
  const tags = createTags({ getParentLayers: () => pending.promise })
  const beforeWrite = tags.title.get()

  tags.title.set('Local')
  pending.resolve([parent])

  await expect(beforeWrite).resolves.toBe('Parent')
  await expect(tags.title.get()).resolves.toBe('Local')
})

test('writes and operation snapshots do not read inherited layers', () => {
  const getParentLayers = vi.fn(() => [])
  const tags = createTags({ getParentLayers })
  tags.title.set('Local')
  assert(isTags(tags))

  expect(tags.operations).toHaveLength(1)
  expect(getParentLayers).not.toHaveBeenCalled()
})

test('captures a metadata selector before awaiting inherited values', async () => {
  const pending = Promise.withResolvers<readonly TagLayer[]>()
  const parent = layer((tags) => tags.meta.add({ name: 'description', content: 'Description' }))
  const tags = createTags({ getParentLayers: () => pending.promise })
  const selector = { name: 'description' }
  const metadata = tags.meta.get(selector)

  selector.name = 'author'
  pending.resolve([parent])

  await expect(metadata).resolves.toEqual([{ name: 'description', content: 'Description' }])
})

test('captures a link selector before awaiting inherited values', async () => {
  const pending = Promise.withResolvers<readonly TagLayer[]>()
  const parent = layer((tags) => tags.link.add({ rel: 'icon', href: '/icon.svg' }))
  const tags = createTags({ getParentLayers: () => pending.promise })
  const selector = { rel: 'icon' }
  const links = tags.link.get(selector)

  selector.rel = 'canonical'
  pending.resolve([parent])

  await expect(links).resolves.toEqual([{ rel: 'icon', href: '/icon.svg' }])
})

test('each read uses the latest ancestor layers', async () => {
  let parent = layer((tags) => tags.title.set('Original'))
  const tags = createTags({ getParentLayers: () => [parent] })
  const original = await tags.get()

  parent = layer((tags) => tags.title.set('Updated'))

  await expect(tags.title.get()).resolves.toBe('Updated')
  expect(original.title).toBe('Original')
})

test('returned metadata trees do not share mutable descriptors with stored layers', async () => {
  const descriptor: MetaTag = {
    property: 'custom:item',
    content: 'Item',
    related: [{ property: 'custom:detail', content: 'Detail', related: [{ name: 'label', content: 'Label' }] }],
  }
  const parent = layer((tags) => tags.meta.add(descriptor))
  const tags = createTags({ getParentLayers: () => [parent] })
  const snapshot = await tags.get()
  const grandchild = snapshot.meta[0].related?.[0].related?.[0]
  assert(grandchild)

  Reflect.set(grandchild, 'content', 'Changed')

  await expect(tags.meta.get()).resolves.toEqual([descriptor])
})

test('metadata reads select primary entries and retain their related tags', async () => {
  const selected = { property: 'og:image', content: '/square.jpg', key: 'square', related: [{ property: 'og:image:alt', content: 'Square' }] }
  const tags = createTags()
  tags.meta.add({ property: 'og:image', content: '/wide.jpg', key: 'wide' })
  tags.meta.add(selected)

  await expect(tags.meta.get({ property: 'og:image', key: 'square' })).resolves.toEqual([selected])
  await expect(tags.meta.get({ property: 'og:image:alt' })).resolves.toEqual([])
})

test('link reads select matching variants', async () => {
  const tags = createTags()
  tags.link.add({ rel: 'icon', href: '/small.png', sizes: '16x16' })
  tags.link.add({ rel: 'icon', href: '/large.png', sizes: '32x32' })

  await expect(tags.link.get({ rel: 'icon', sizes: '32x32' })).resolves.toEqual([{ rel: 'icon', href: '/large.png', sizes: '32x32' }])
})

test('operation snapshots do not include subsequent writes', () => {
  const tags = createTags()
  tags.title.set('Original')
  assert(isTags(tags))
  const operations = tags.operations

  tags.title.set('Later')

  expect(operations).toMatchObject([{ kind: 'set', groups: [{ value: 'Original' }] }])
  expect(tags.operations).toHaveLength(2)
})
