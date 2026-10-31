import { expectTypeOf, test } from 'vitest'
import type { LinkBase, Meta } from 'zhead'
import { createTags } from '@/services/createTags'
import { toTagLayer } from '@/services/toTagLayer'
import { TagLayer, LinkTag, MetaTag, Tags } from '@/types/tags'

test('uses zhead attribute types while allowing custom metadata and recursive related entries', () => {
  const tags = createTags()

  tags.title.set('Product')
  tags.meta.set({
    name: 'description',
    content: 'Product details',
  })
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
  tags.meta.add({
    property: 'new:property',
    content: 42,
  })
  tags.meta.add({
    name: 'new:name',
    content: true,
  })
  tags.link.set({
    rel: 'preload',
    href: '/image.jpg',
    as: 'image',
    imagesrcset: '/image.jpg 1x, /large.jpg 2x',
  })

  expectTypeOf<MetaTag['property']>().toEqualTypeOf<Meta['property']>()
  expectTypeOf<MetaTag['name']>().toEqualTypeOf<Meta['name']>()
  expectTypeOf<MetaTag['content']>().toEqualTypeOf<NonNullable<Meta['content']>>()
  expectTypeOf<LinkTag['as']>().toEqualTypeOf<LinkBase['as']>()
  expectTypeOf(toTagLayer(tags)).toEqualTypeOf<TagLayer>()
  expectTypeOf(createTags()).toEqualTypeOf<Tags>()
})

test('requires explicit attributes and validates related descriptors recursively', () => {
  const tags = createTags()

  // @ts-expect-error titles are single string values
  tags.title.set(42)
  // @ts-expect-error titles cannot be appended
  tags.title.add('Another title')
  // @ts-expect-error descriptors are explicit; there is no inferred property/name shorthand
  tags.meta.set('og:image', '/image.jpg')
  // @ts-expect-error metadata must identify its name or property
  tags.meta.set({ content: 'Missing identifier' })
  // @ts-expect-error metadata cannot be both name and property metadata
  tags.meta.set({ name: 'description', property: 'og:description', content: 'Ambiguous' })
  // @ts-expect-error content is required
  tags.meta.set({ property: 'og:image' })
  // @ts-expect-error nested related descriptors also require an identifier
  tags.meta.add({ property: 'custom:root', content: 'Root', related: [{ content: 'Missing identifier' }] })
  // @ts-expect-error related tags are descriptors, not callbacks
  tags.meta.add({ property: 'custom:root', content: 'Root', related: () => [] })
  // @ts-expect-error links require a destination
  tags.link.set({ rel: 'icon' })
  // @ts-expect-error zhead constrains the resource destination type
  tags.link.set({ rel: 'preload', href: '/image.jpg', as: 'unsupported' })
  // @ts-expect-error link handlers are not part of the tag data schema
  tags.link.set({ rel: 'icon', href: '/icon.svg', onload: 'run()' })
  // @ts-expect-error head tags do not accept scripts
  tags.script.add({ src: '/script.js' })
})

test('reads are asynchronous and recursively readonly', async () => {
  const tags = createTags()
  const snapshot = await tags.get()
  const meta = await tags.meta.get({ property: 'og:image' })
  const links = await tags.link.get({ rel: 'icon' })

  expectTypeOf(tags.title.get()).toEqualTypeOf<Promise<string | undefined>>()
  expectTypeOf(meta[0].content).toEqualTypeOf<NonNullable<Meta['content']>>()
  expectTypeOf(links[0].as).toEqualTypeOf<LinkBase['as']>()

  // @ts-expect-error a snapshot is a value, not another mutable builder
  snapshot.title = 'Changed'
  // @ts-expect-error returned collections are readonly
  meta.push({ property: 'og:image', content: '/changed.jpg' })
  // @ts-expect-error returned descriptors are readonly
  meta[0].content = 'Changed'
  const related = meta[0].related

  if (related) {
    // @ts-expect-error nested related descriptors are also readonly
    related[0].content = 'Changed'
  }
  // @ts-expect-error metadata identifiers remain readonly too
  meta[0].property = 'custom:changed'
  // @ts-expect-error links cannot be changed through a read
  links[0].href = '/changed.svg'
})

test('callbacks receive the scoped API without lifecycle or storage methods', () => {
  const tags = createTags()

  // @ts-expect-error there is no finalization step
  tags.finish()
  // @ts-expect-error the local layer is internal to the callback runner
  expectTypeOf(tags.layer)
})
