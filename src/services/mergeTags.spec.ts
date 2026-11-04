import { expect, test } from 'vitest'
import { matchesTag, mergeTags } from '@/services/mergeTags'
import { TagGroup, TagLayer, TagSelector } from '@/types/tags'

const description: TagGroup = {
  tag: 'meta',
  attributes: { name: 'description', media: '' },
  value: { name: 'description', content: 'Parent description' },
}
const image: TagGroup = {
  tag: 'meta',
  attributes: { property: 'og:image', media: '' },
  value: {
    property: 'og:image',
    content: '/parent.jpg',
    related: [{ property: 'og:image:alt', content: 'Parent' }],
  },
}

test('set removes every matching group and retains unrelated groups in order', () => {
  const replacement: TagGroup = { ...image, value: { property: 'og:image', content: '/child.jpg' } }
  const parent: TagLayer = [{ kind: 'add', target: image, groups: [image, description, image] }]
  const child: TagLayer = [{ kind: 'set', target: image, groups: [replacement] }]

  expect(mergeTags([parent, child])).toEqual([description, replacement])
})

test('add retains duplicate groups and their related descriptors', () => {
  const parent: TagLayer = [{ kind: 'add', target: image, groups: [image] }]
  const child: TagLayer = [{ kind: 'add', target: image, groups: [image] }]

  expect(mergeTags([parent, child])).toEqual([image, image])
})

test('delete removes the complete group without altering underlying layers', () => {
  const parent: TagLayer = [{ kind: 'add', target: image, groups: [image, description] }]
  const child: TagLayer = [{ kind: 'delete', target: image }]

  expect(mergeTags([parent, child])).toEqual([description])
  expect(mergeTags([parent])).toEqual([image, description])
})

test('applies writes after deletions in declaration order', () => {
  const target: TagSelector = { tag: 'title', attributes: {} }
  const original: TagGroup = { ...target, tag: 'title', value: 'Original' }
  const replacement: TagGroup = { ...original, value: 'Replacement' }
  const layer: TagLayer = [
    { kind: 'set', target, groups: [original] },
    { kind: 'delete', target },
    { kind: 'set', target, groups: [replacement] },
  ]

  expect(mergeTags([layer])).toEqual([replacement])
})

test('a higher layer can restore a value deleted by an intermediate layer', () => {
  const parent: TagLayer = [{ kind: 'add', target: image, groups: [image] }]
  const deleted: TagLayer = [{ kind: 'delete', target: image }]
  const child: TagLayer = [{ kind: 'add', target: image, groups: [image] }]

  expect(mergeTags([parent, deleted, child])).toEqual([image])
})

test('related descriptors do not match independently of their owner', () => {
  const parent: TagLayer = [{ kind: 'add', target: image, groups: [image] }]
  const child: TagLayer = [{ kind: 'delete', target: { tag: 'meta', attributes: { property: 'og:image:alt' } } }]

  expect(mergeTags([parent, child])).toEqual([image])
})

test.each<{
  name: string,
  group: TagGroup,
  target: TagSelector,
  matches: boolean,
}>([
  {
    name: 'element type is part of identity',
    group: description,
    target: { tag: 'link', attributes: { name: 'description' } },
    matches: false,
  },
  {
    name: 'omitted attributes leave variants unconstrained',
    group: description,
    target: { tag: 'meta', attributes: { name: 'description' } },
    matches: true,
  },
  {
    name: 'all supplied attributes must match',
    group: description,
    target: { tag: 'meta', attributes: { name: 'description', media: 'dark' } },
    matches: false,
  },
  {
    name: 'name and property are distinct identifiers',
    group: description,
    target: { tag: 'meta', attributes: { property: 'description' } },
    matches: false,
  },
  {
    name: 'selectors can constrain descriptor attributes outside the default identity',
    group: { tag: 'link', attributes: { rel: 'canonical' }, value: { rel: 'canonical', href: '/product' } },
    target: { tag: 'link', attributes: { rel: 'canonical', href: '/product' } },
    matches: true,
  },
])('$name', ({ group, target, matches }) => {
  expect(matchesTag(group, target)).toBe(matches)
})
