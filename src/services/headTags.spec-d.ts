import { expectTypeOf, test } from 'vitest'
import { createHeadTagsBuilder } from '@/services/createHeadTagsBuilder'
import { HeadLayer } from '@/types/headTags'

test('the supplied tags support typed metadata, images, and links', () => {
  const { tags, finish } = createHeadTagsBuilder()

  tags.title.set('Product')
  tags.meta.set('description', 'Product details')
  tags.meta.set('og:image', {
    url: '/product.jpg',
    alt: 'Product',
    width: 1200,
  })
  tags.meta.add('og:audio', {
    url: '/audio.mp3',
    type: 'audio/mpeg',
  })
  tags.link.set({
    rel: 'icon',
    href: '/favicon.svg',
  })

  expectTypeOf(finish()).toEqualTypeOf<HeadLayer>()
  expectTypeOf(tags.title.set('Title')).toEqualTypeOf<void>()
})

test('invalid descriptors are rejected without widening known media types', () => {
  const { tags } = createHeadTagsBuilder()

  // @ts-expect-error titles are single string values
  tags.title.set(42)
  // @ts-expect-error titles cannot be appended
  tags.title.add('Another title')
  // @ts-expect-error images require a URL
  tags.meta.set('og:image', { alt: 'Missing URL' })
  // @ts-expect-error media attributes cannot become a generic metadata value
  tags.meta.set('og:image', { content: '/image.jpg' })
  // @ts-expect-error dimensions must be numeric
  tags.meta.set('og:image', { url: '/image.jpg', width: 'wide' })
  // @ts-expect-error audio has no dimensions
  tags.meta.add('og:audio', { url: '/audio.mp3', width: 1200 })
  // @ts-expect-error normal metadata requires content
  tags.meta.set('description', { url: '/image.jpg' })
  // @ts-expect-error raw descriptors must identify their metadata
  tags.meta.set({ content: 'Missing identifier' })
  // @ts-expect-error a raw descriptor cannot be both name and property metadata
  tags.meta.set({ name: 'description', property: 'og:description', content: 'Ambiguous' })
  // @ts-expect-error links require a destination
  tags.link.set({ rel: 'icon' })
  // @ts-expect-error head tags do not accept scripts
  tags.script.add({ src: '/script.js' })
})
