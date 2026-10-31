import { expectTypeOf, test } from 'vitest'
import type { LinkBase, Meta } from 'zhead'
import { createTagsBuilder } from '@/services/createTagsBuilder'
import { TagLayer, LinkTag, MetaTag } from '@/types/tags'

test('uses zhead attribute types while allowing custom metadata and recursive related entries', () => {
  const { tags, finish } = createTagsBuilder()

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
  expectTypeOf(finish()).toEqualTypeOf<TagLayer>()
})

test('requires explicit attributes and validates related descriptors recursively', () => {
  const { tags } = createTagsBuilder()

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
