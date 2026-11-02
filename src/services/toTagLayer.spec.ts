import { describe, expect, test } from 'vitest'
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
  return {
    property: 'og:image',
    content: url,
    related: alt === undefined
      ? []
      : [{
          property: 'og:image:alt',
          content: alt,
        }],
  }
}

function elements(...layers: TagLayer[]): readonly TagElement[] {
  return flattenTags(mergeTags(layers))
}

function contents(...layers: TagLayer[]): (string | undefined)[] {
  return elements(...layers).map((element) => element.textContent ?? element.attributes.content ?? element.attributes.href)
}

describe('toTagLayer', () => {
  test('converts only local operations, preserving deletions without including inherited values', async () => {
    const parent = layer((tags) => {
      tags.title.set('Parent')
      tags.meta.set({
        name: 'description',
        content: 'Parent description',
      })
    })
    const tags = createTags({ getParentLayers: () => [parent] })

    tags.meta.delete({ name: 'description' })

    await expect(tags.title.get()).resolves.toBe('Parent')

    const local = toTagLayer(tags)

    expect(contents(local)).toEqual([])
    expect(contents(parent, local)).toEqual(['Parent'])
    expect(contents(parent)).toEqual(['Parent', 'Parent description'])
  })

  test('snapshots local operations without closing the scoped API', () => {
    const tags = createTags()

    tags.meta.set(image('/original.jpg', 'Original'))

    const value = toTagLayer(tags)

    tags.title.set('Updated')

    expect(contents(toTagLayer(tags))).toEqual(['/original.jpg', 'Original', 'Updated'])
    expect(contents(value)).toEqual(['/original.jpg', 'Original'])
  })
})
