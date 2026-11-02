import { assert, describe, expect, test } from 'vitest'
import { createTags } from '@/services/createTags'
import { mergeTags } from '@/services/mergeTags'
import { flattenTags } from '@/services/flattenTags'
import { TagElement, TagLayer, MetaTag, Tags, isTags } from '@/types/tags'

function layer(callback: (tags: Tags) => void): TagLayer {
  const tags = createTags()

  callback(tags)

  assert(isTags(tags))

  return [...tags.operations]
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

describe('mergeTags', () => {
  test('inherits untouched tags and replaces the title and description', () => {
    const parent = layer((tags) => {
      tags.title.set('Store')
      tags.meta.set({
        name: 'description',
        content: 'Browse products',
      })
      tags.meta.set({
        property: 'og:site_name',
        content: 'Kitbag',
      })
    })
    const child = layer((tags) => {
      tags.title.set('Keyboard')
      tags.meta.set({
        name: 'description',
        content: 'Mechanical keyboard',
      })
    })

    expect(contents(parent, child)).toEqual(['Kitbag', 'Keyboard', 'Mechanical keyboard'])
  })

  test('applies operations in declaration order and permits an empty title', () => {
    const value = layer((tags) => {
      tags.meta.add({
        name: 'author',
        content: 'First',
      })
      tags.meta.set({
        name: 'author',
        content: 'Replacement',
      })
      tags.meta.add({
        name: 'author',
        content: 'Last',
      })
      tags.title.set('')
    })

    expect(contents(value)).toEqual(['Replacement', 'Last', ''])
  })

  test('removing a layer reveals updated underlying values and removes added entries', () => {
    const parent = layer((tags) => tags.title.set('Original'))
    const updatedParent = layer((tags) => tags.title.set('Updated'))
    const child = layer((tags) => {
      tags.title.set('Override')
      tags.meta.add({
        name: 'author',
        content: 'Guest',
      })
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

  test('can replay serialized related tags and deletions without a builder or DOM', () => {
    const parent = layer((tags) => tags.meta.set(image('/parent.jpg', 'Parent')))
    const child = layer((tags) => {
      tags.meta.delete({ property: 'og:image' })
      tags.title.set('A <title> & text')
      tags.meta.add(image('/child.jpg', 'Child'))
    })
    const serialized: TagLayer[] = JSON.parse(JSON.stringify([parent, child]))

    expect(mergeTags(serialized)).toEqual(mergeTags([parent, child]))
    expect(contents(...serialized)).toEqual(['A <title> & text', '/child.jpg', 'Child'])
  })

  test('replaces complete image groups without retaining parent related tags', () => {
    const parent = layer((tags) => {
      tags.meta.add(image('/front.jpg', 'Front'))
      tags.meta.add(image('/back.jpg', 'Back'))
    })
    const child = layer((tags) => tags.meta.set(image('/child.jpg')))

    expect(contents(parent, child)).toEqual(['/child.jpg'])
    expect(elements(parent, child)[0].attributes).toEqual({
      property: 'og:image',
      content: '/child.jpg',
    })
  })

  test('appends whole groups in order, including repeated values', () => {
    const parent = layer((tags) => tags.meta.set(image('/image.jpg', 'Image')))
    const child = layer((tags) => tags.meta.add(image('/image.jpg', 'Image')))

    expect(mergeTags([parent, child])).toHaveLength(2)
    expect(contents(parent, child)).toEqual(['/image.jpg', 'Image', '/image.jpg', 'Image'])
  })

  test('deletes the complete recursive subtree and restores it when that layer leaves', () => {
    const parent = layer((tags) => tags.meta.set({
      property: 'new:root',
      content: 'Root',
      related: [{
        property: 'new:child',
        content: 'Child',
        related: [{
          property: 'new:grandchild',
          content: 'Grandchild',
        }],
      }],
    }))
    const child = layer((tags) => tags.meta.delete({ property: 'new:root' }))

    expect(contents(parent, child)).toEqual([])
    expect(contents(parent)).toEqual(['Root', 'Child', 'Grandchild'])
  })

  test('replacing a primary tag also replaces all levels of its related subtree', () => {
    const parent = layer((tags) => tags.meta.set({
      property: 'new:root',
      content: 'Parent',
      related: [{
        property: 'new:detail',
        content: 'Parent detail',
        related: [{
          property: 'new:label',
          content: 'Parent label',
        }],
      }],
    }))
    const child = layer((tags) => tags.meta.set({
      property: 'new:root',
      content: 'Child',
      related: [{
        property: 'new:detail',
        content: 'Child detail',
      }],
    }))

    expect(contents(parent, child)).toEqual(['Child', 'Child detail'])
  })

  test('a related tag does not overwrite an independent entry with the same property', () => {
    const parent = layer((tags) => tags.meta.add({
      property: 'custom:detail',
      content: 'Independent',
    }))
    const child = layer((tags) => tags.meta.add({
      property: 'custom:item',
      content: 'Item',
      related: [{
        property: 'custom:detail',
        content: 'Related',
      }],
    }))

    expect(contents(parent, child)).toEqual(['Independent', 'Item', 'Related'])
    expect(contents(parent)).toEqual(['Independent'])
  })
})
