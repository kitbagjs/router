import { expectTypeOf, test } from 'vitest'
import { createTags } from '@/services/createTags'

test('accepts a single string title', () => {
  const tags = createTags()

  tags.title.set('Product')

  // @ts-expect-error titles are single string values
  tags.title.set(42)
  // @ts-expect-error titles cannot be appended
  tags.title.add('Another title')
})

test('requires explicit metadata identifiers and content', () => {
  const tags = createTags()

  tags.meta.set({
    name: 'description',
    content: 'Product details',
  })

  // @ts-expect-error descriptors are explicit; there is no inferred property/name shorthand
  tags.meta.set('og:image', '/image.jpg')
  // @ts-expect-error metadata must identify its name or property
  tags.meta.set({ content: 'Missing identifier' })
  // @ts-expect-error metadata cannot be both name and property metadata
  tags.meta.set({ name: 'description', property: 'og:description', content: 'Ambiguous' })
  // @ts-expect-error content is required
  tags.meta.set({ property: 'og:image' })
})

test('accepts recursive related metadata', () => {
  const tags = createTags()

  tags.meta.set({
    property: 'og:image',
    content: '/product.jpg',
    related: [{
      property: 'og:image:alt',
      content: 'Product',
      related: [{
        property: 'custom:label',
        content: 'Label',
      }],
    }],
  })

  // @ts-expect-error nested related descriptors also require an identifier
  tags.meta.add({ property: 'custom:root', content: 'Root', related: [{ content: 'Missing identifier' }] })
})

test('accepts custom metadata identifiers with numeric and boolean content', () => {
  const tags = createTags()

  tags.meta.add({
    property: 'new:property',
    content: 42,
  })
  tags.meta.add({
    name: 'new:name',
    content: true,
  })
})

test('accepts zhead link attributes', () => {
  const tags = createTags()

  tags.link.set({
    rel: 'preload',
    href: '/image.jpg',
    as: 'image',
    imagesrcset: '/image.jpg 1x, /large.jpg 2x',
  })

  // @ts-expect-error links require a destination
  tags.link.set({ rel: 'icon' })
  // @ts-expect-error zhead constrains the resource destination type
  tags.link.set({ rel: 'preload', href: '/image.jpg', as: 'unsupported' })
  // @ts-expect-error link handlers are not part of the tag data schema
  tags.link.set({ rel: 'icon', href: '/icon.svg', onload: 'run()' })
})

test('snapshots cannot be written through the read API', async () => {
  const snapshot = await createTags().get()

  // @ts-expect-error snapshots are readonly
  snapshot.title = 'Changed'
})

test('metadata reads are recursively readonly', async () => {
  const meta = await createTags().meta.get()

  // @ts-expect-error returned collections are readonly
  meta.push({ property: 'og:image', content: '/changed.jpg' })
  // @ts-expect-error returned descriptors are readonly
  meta[0].content = 'Changed'

  const related = meta[0].related

  if (related) {
    // @ts-expect-error nested descriptors are readonly
    related[0].content = 'Changed'
  }
})

test('link reads are recursively readonly', async () => {
  const links = await createTags().link.get()

  // @ts-expect-error returned descriptors are readonly
  links[0].href = '/changed.svg'

  const related = links[0].related

  if (related) {
    // @ts-expect-error nested descriptors are readonly
    related[0].href = '/changed-related.svg'
  }
})

test('does not expose stored operations to callbacks', () => {
  const tags = createTags()

  // @ts-expect-error recorded operations are internal to the callback runner
  expectTypeOf(tags.operations)
})
