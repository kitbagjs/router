import { describe, expect, test } from 'vitest'
import { createHeadTagsBuilder } from '@/services/createHeadTagsBuilder'
import { mergeHeadLayers } from '@/services/mergeHeadLayers'
import { HeadElement, HeadLayer, HeadTags } from '@/types/headTags'

function layer(callback: (tags: HeadTags) => void): HeadLayer {
  const builder = createHeadTagsBuilder()

  callback(builder.tags)

  return builder.finish()
}

function elements(...layers: HeadLayer[]): readonly HeadElement[] {
  return mergeHeadLayers(layers).flatMap((group) => group.elements)
}

function contents(...layers: HeadLayer[]): (string | undefined)[] {
  return elements(...layers).map((element) => element.textContent ?? element.attributes.content ?? element.attributes.href)
}

describe('layers', () => {
  test('inherits untouched tags and replaces the title and description', () => {
    const parent = layer((tags) => {
      tags.title.set('Store')
      tags.meta.set('description', 'Browse products')
      tags.meta.set('og:site_name', 'Kitbag')
    })
    const child = layer((tags) => {
      tags.title.set('Keyboard')
      tags.meta.set('description', 'Mechanical keyboard')
    })

    expect(contents(parent, child)).toEqual(['Kitbag', 'Keyboard', 'Mechanical keyboard'])
  })

  test('applies operations in declaration order and permits an empty title', () => {
    const value = layer((tags) => {
      tags.meta.add('author', 'First')
      tags.meta.set('author', 'Replacement')
      tags.meta.add('author', 'Last')
      tags.title.set('')
    })

    expect(contents(value)).toEqual(['Replacement', 'Last', ''])
  })

  test('removing a layer reveals updated underlying values and removes added entries', () => {
    const parent = layer((tags) => tags.title.set('Original'))
    const updatedParent = layer((tags) => tags.title.set('Updated'))
    const child = layer((tags) => {
      tags.title.set('Override')
      tags.meta.add('author', 'Guest')
    })

    expect(contents(parent, child)).toEqual(['Override', 'Guest'])
    expect(contents(updatedParent, child)).toEqual(['Override', 'Guest'])
    expect(contents(updatedParent)).toEqual(['Updated'])
    expect(contents(parent)).toEqual(['Original'])
  })

  test('deletion is scoped and a higher layer can supply the deleted value', () => {
    const parent = layer((tags) => tags.title.set('Parent'))
    const deleted = layer((tags) => tags.title.delete())
    const child = layer((tags) => tags.title.set('Child'))

    expect(contents(parent, deleted)).toEqual([])
    expect(contents(parent, deleted, child)).toEqual(['Child'])
    expect(contents(parent)).toEqual(['Parent'])
  })

  test('can replay serialized layers without a builder or DOM', () => {
    const parent = layer((tags) => tags.meta.set('description', 'Parent'))
    const child = layer((tags) => {
      tags.meta.delete('description')
      tags.title.set('A <title> & text')
    })
    const serialized: HeadLayer[] = JSON.parse(JSON.stringify([parent, child]))

    expect(mergeHeadLayers(serialized)).toEqual(mergeHeadLayers([parent, child]))
    expect(contents(...serialized)).toEqual(['A <title> & text'])
  })
})

describe('metadata', () => {
  test('replaces complete image groups without retaining parent structured properties', () => {
    const parent = layer((tags) => tags.meta.set('og:image', [
      {
        url: '/front.jpg',
        alt: 'Front',
        width: 1200,
        height: 630,
      },
      {
        url: '/back.jpg',
        alt: 'Back',
      },
    ]))
    const child = layer((tags) => tags.meta.set('og:image', '/child.jpg'))

    expect(contents(parent, child)).toEqual(['/child.jpg'])
    expect(elements(parent, child)[0].attributes).toEqual({
      property: 'og:image',
      content: '/child.jpg',
    })
  })

  test('appends whole image groups in order, including repeated values', () => {
    const image = {
      url: '/image.jpg',
      alt: 'Image',
    }
    const parent = layer((tags) => tags.meta.set('og:image', image))
    const child = layer((tags) => tags.meta.add('og:image', image))
    const merged = mergeHeadLayers([parent, child])

    expect(merged).toHaveLength(2)
    expect(contents(parent, child)).toEqual(['/image.jpg', 'Image', '/image.jpg', 'Image'])
  })

  test('raw media descriptors and shorthand replace the same complete groups', () => {
    const parent = layer((tags) => tags.meta.set('og:image', {
      url: '/parent.jpg',
      alt: 'Parent',
    }))
    const raw = layer((tags) => tags.meta.set({
      property: 'og:image',
      content: '/raw.jpg',
    }))
    const child = layer((tags) => tags.meta.set('og:image', '/child.jpg'))

    expect(contents(parent, raw)).toEqual(['/raw.jpg'])
    expect(contents(raw, child)).toEqual(['/child.jpg'])
  })

  test('clears a collection with an empty set and restores it when that layer leaves', () => {
    const parent = layer((tags) => tags.meta.set('og:image', {
      url: '/image.jpg',
      alt: 'Image',
    }))
    const child = layer((tags) => {
      tags.meta.set('og:image', [])
      tags.meta.add('author', [])
    })

    expect(contents(parent, child)).toEqual([])
    expect(contents(parent)).toEqual(['/image.jpg', 'Image'])
  })

  test('deletes an entire image group', () => {
    const parent = layer((tags) => tags.meta.set('og:image', {
      url: '/image.jpg',
      alt: 'Image',
      secureUrl: 'https://example.com/image.jpg',
      type: 'image/jpeg',
    }))
    const child = layer((tags) => tags.meta.delete('og:image'))

    expect(contents(parent, child)).toEqual([])
    expect(contents(parent)).toEqual(['/image.jpg', 'https://example.com/image.jpg', 'image/jpeg', 'Image'])
  })

  test('groups video and audio properties as well as images', () => {
    const parent = layer((tags) => {
      tags.meta.set('og:video', {
        url: '/video.mp4',
        width: 1920,
        height: 1080,
      })
      tags.meta.set('og:audio', {
        url: '/audio.mp3',
        type: 'audio/mpeg',
      })
    })

    expect(elements(parent).map((element) => element.attributes.property)).toEqual([
      'og:video', 'og:video:width', 'og:video:height', 'og:audio', 'og:audio:type',
    ])
  })

  test('overrides one theme-color variant and can delete every variant', () => {
    const parent = layer((tags) => tags.meta.set('theme-color', [
      {
        content: 'white',
        media: '(prefers-color-scheme: light)',
      },
      {
        content: 'black',
        media: '(prefers-color-scheme: dark)',
      },
    ]))
    const child = layer((tags) => tags.meta.set('theme-color', {
      content: 'navy',
      media: '(prefers-color-scheme: dark)',
    }))
    const deleted = layer((tags) => tags.meta.delete('theme-color'))

    expect(contents(parent, child)).toEqual(['white', 'navy'])
    expect(contents(parent, child, deleted)).toEqual([])
  })

  test('sets several variants without leaving inherited copies or changing their order', () => {
    const parent = layer((tags) => tags.meta.set('theme-color', [
      {
        content: 'white',
        media: 'light',
      },
      {
        content: 'black',
        media: 'dark',
      },
    ]))
    const child = layer((tags) => tags.meta.set('theme-color', [
      {
        content: 'navy',
        media: 'dark',
      },
      {
        content: 'ivory',
        media: 'light',
      },
    ]))

    expect(contents(parent, child)).toEqual(['navy', 'ivory'])
  })

  test('deletes just the selected media variant', () => {
    const parent = layer((tags) => tags.meta.set('theme-color', [
      {
        content: 'white',
        media: 'light',
      },
      {
        content: 'black',
        media: 'dark',
      },
    ]))
    const child = layer((tags) => tags.meta.delete('theme-color', { media: 'dark' }))

    expect(contents(parent, child)).toEqual(['white'])
  })

  test('an explicit key replaces a selected image group without becoming an HTML attribute', () => {
    const parent = layer((tags) => {
      tags.meta.add('og:image', {
        url: '/wide.jpg',
        alt: 'Wide',
        key: 'wide',
      })
      tags.meta.add('og:image', {
        url: '/square.jpg',
        alt: 'Square',
        key: 'square',
      })
    })
    const child = layer((tags) => tags.meta.set('og:image', {
      url: '/new-wide.jpg',
      key: 'wide',
    }))

    expect(contents(parent, child)).toEqual(['/square.jpg', 'Square', '/new-wide.jpg'])
    expect(elements(parent, child).every((element) => !('key' in element.attributes))).toBe(true)
  })

  test('distinguishes name from property and accepts custom property descriptors', () => {
    const parent = layer((tags) => {
      tags.meta.set({
        name: 'custom:field',
        content: 'Named',
      })
      tags.meta.set({
        property: 'custom:field',
        content: 'Property',
      })
      tags.meta.set('twitter:card', 'summary')
    })
    const child = layer((tags) => tags.meta.delete({ property: 'custom:field' }))

    expect(contents(parent, child)).toEqual(['Named', 'summary'])
    expect(elements(parent)[2].attributes.name).toBe('twitter:card')
  })
})

describe('links', () => {
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

  test('link deletion can match attributes beyond the default identity', () => {
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
})

describe('builder ownership', () => {
  test('copies supplied descriptors before they can be changed by their owner', () => {
    const image = {
      url: '/original.jpg',
      alt: 'Original',
    }
    const link = {
      rel: 'icon',
      href: '/original.svg',
    }
    const value = layer((tags) => {
      tags.meta.set('og:image', image)
      tags.link.set(link)
      image.url = '/changed.jpg'
      image.alt = 'Changed'
      link.href = '/changed.svg'
    })

    expect(contents(value)).toEqual(['/original.jpg', 'Original', '/original.svg'])
  })

  test('finishes once, freezes nested values, and rejects late writes', () => {
    const builder = createHeadTagsBuilder()

    builder.tags.title.set('Original')

    const value = builder.finish()
    const merged = mergeHeadLayers([value])

    expect(builder.finish()).toBe(value)
    expect(() => builder.tags.title.set('Late')).toThrow()
    expect(Reflect.set(value, '0', {})).toBe(false)
    expect(Reflect.set(merged[0].elements[0], 'textContent', 'Changed')).toBe(false)
    expect(Reflect.set(merged[0].selector.attributes, 'key', 'Changed')).toBe(false)
    expect(Reflect.set(merged[0].elements[0].attributes, 'name', 'Changed')).toBe(false)
    expect(contents(value)).toEqual(['Original'])
  })
})
