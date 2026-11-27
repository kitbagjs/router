import { expect, test } from 'vitest'
import { toResolvedTags } from '@/utilities/toResolvedTags'

test('metadata selectors distinguish name from property and require every supplied attribute', () => {
  const light = { name: 'theme-color', content: 'white', media: 'light' }
  const dark = { name: 'theme-color', content: 'black', media: 'dark' }
  const property = { property: 'theme-color', content: 'custom' }
  const resolved = toResolvedTags([
    { tag: 'meta', attributes: {}, value: light },
    { tag: 'meta', attributes: {}, value: dark },
    { tag: 'meta', attributes: {}, value: property },
  ])

  expect(resolved.meta.get()).toEqual([light, dark, property])
  expect(resolved.meta.get({ name: 'theme-color', media: undefined })).toEqual([light, dark])
  expect(resolved.meta.get({ name: 'theme-color', media: 'dark' })).toEqual([dark])
  expect(resolved.meta.get({ property: 'theme-color' })).toEqual([property])
  expect(resolved.meta.get({ name: 'theme-color', media: 'missing' })).toEqual([])
})

test('link selectors retain duplicate matches and narrow variants by multiple attributes', () => {
  const first = { rel: 'icon', href: '/first.png', sizes: '32x32', type: 'image/png' }
  const second = { ...first, href: '/second.png' }
  const large = { ...first, sizes: '64x64' }
  const resolved = toResolvedTags([
    { tag: 'link', attributes: {}, value: first },
    { tag: 'link', attributes: {}, value: second },
    { tag: 'link', attributes: {}, value: large },
  ])

  expect(resolved.link.get()).toEqual([first, second, large])
  expect(resolved.link.get({ rel: 'icon', sizes: '32x32', type: 'image/png' })).toEqual([first, second])
  expect(resolved.link.get({ rel: 'icon', sizes: '32x32', href: '/second.png' })).toEqual([second])
  expect(resolved.link.get({ rel: 'canonical' })).toEqual([])
})
