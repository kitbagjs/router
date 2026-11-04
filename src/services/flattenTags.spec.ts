import { expect, test } from 'vitest'
import { flattenTags } from '@/services/flattenTags'
import { TagGroup } from '@/types/tags'

test('preserves title text for the renderer', () => {
  const groups: TagGroup[] = [{
    tag: 'title',
    attributes: {},
    value: 'A <title> & text',
  }]

  expect(flattenTags(groups)).toEqual([{
    tag: 'title',
    attributes: {},
    textContent: 'A <title> & text',
  }])
})

test('recursively flattens related metadata before the next sibling without interpreting names', () => {
  const groups: TagGroup[] = [
    {
      tag: 'meta',
      attributes: {},
      value: {
        property: 'custom:item',
        content: 'Item',
        key: 'item',
        related: [
          {
            property: 'different:detail',
            content: 'Detail',
            related: [{
              name: 'label',
              content: 'Label',
            }],
          },
          {
            property: 'custom:sibling',
            content: 'Sibling',
          },
        ],
      },
    },
    {
      tag: 'meta',
      attributes: {},
      value: {
        property: 'custom:item',
        content: 'Next item',
      },
    },
  ]
  const elements = flattenTags(groups)

  expect(elements).toEqual([
    { tag: 'meta', attributes: { property: 'custom:item', content: 'Item' } },
    { tag: 'meta', attributes: { property: 'different:detail', content: 'Detail' } },
    { tag: 'meta', attributes: { name: 'label', content: 'Label' } },
    { tag: 'meta', attributes: { property: 'custom:sibling', content: 'Sibling' } },
    { tag: 'meta', attributes: { property: 'custom:item', content: 'Next item' } },
  ])
})

test('converts numeric and boolean metadata content to strings', () => {
  const groups: TagGroup[] = [
    {
      tag: 'meta',
      attributes: {},
      value: {
        property: 'og:image:width',
        content: 1200,
      },
    },
    {
      tag: 'meta',
      attributes: {},
      value: {
        name: 'custom:enabled',
        content: true,
      },
    },
  ]

  expect(flattenTags(groups).map((element) => element.attributes.content)).toEqual(['1200', 'true'])
})

test('flattens related links and omits keys and undefined attributes', () => {
  const groups: TagGroup[] = [{
    tag: 'link',
    attributes: {},
    value: {
      rel: 'alternate',
      href: '/en',
      hreflang: 'en',
      key: 'languages',
      media: undefined,
      related: [{
        rel: 'alternate',
        href: '/es',
        hreflang: 'es',
      }],
    },
  }]

  expect(flattenTags(groups)).toEqual([
    {
      tag: 'link',
      attributes: {
        rel: 'alternate',
        href: '/en',
        hreflang: 'en',
      },
    },
    {
      tag: 'link',
      attributes: {
        rel: 'alternate',
        href: '/es',
        hreflang: 'es',
      },
    },
  ])
})
