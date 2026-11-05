import { expect, test } from 'vitest'
import { toTagsSnapshot } from '@/utilities/toTagsSnapshot'

test('metadata selectors distinguish name from property and require every supplied attribute', () => {
  const light = { name: 'theme-color', content: 'white', media: 'light' }
  const dark = { name: 'theme-color', content: 'black', media: 'dark' }
  const property = { property: 'theme-color', content: 'custom' }
  const snapshot = toTagsSnapshot([
    { tag: 'meta', attributes: {}, value: light },
    { tag: 'meta', attributes: {}, value: dark },
    { tag: 'meta', attributes: {}, value: property },
  ])

  expect(snapshot.meta.get()).toEqual([light, dark, property])
  expect(snapshot.meta.get({ name: 'theme-color', media: undefined })).toEqual([light, dark])
  expect(snapshot.meta.get({ name: 'theme-color', media: 'dark' })).toEqual([dark])
  expect(snapshot.meta.get({ property: 'theme-color' })).toEqual([property])
  expect(snapshot.meta.get({ name: 'theme-color', media: 'missing' })).toEqual([])
})

test('link selectors retain duplicate matches and narrow variants by multiple attributes', () => {
  const first = { rel: 'icon', href: '/first.png', sizes: '32x32', type: 'image/png' }
  const second = { ...first, href: '/second.png' }
  const large = { ...first, sizes: '64x64' }
  const snapshot = toTagsSnapshot([
    { tag: 'link', attributes: {}, value: first },
    { tag: 'link', attributes: {}, value: second },
    { tag: 'link', attributes: {}, value: large },
  ])

  expect(snapshot.link.get()).toEqual([first, second, large])
  expect(snapshot.link.get({ rel: 'icon', sizes: '32x32', type: 'image/png' })).toEqual([first, second])
  expect(snapshot.link.get({ rel: 'icon', sizes: '32x32', href: '/second.png' })).toEqual([second])
  expect(snapshot.link.get({ rel: 'canonical' })).toEqual([])
})
