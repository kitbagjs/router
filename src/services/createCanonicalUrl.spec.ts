import { expect, test } from 'vitest'
import { createUrl } from '@/services/createUrl'
import { createCanonicalUrl } from '@/services/createCanonicalUrl'

test('carries extra query values and hash, retaining repeated values', () => {
  const route = createUrl({ path: '/user/[id]' })

  expect(createCanonicalUrl(route, { id: '42' }, { query: 'tag=a&tag=b', hash: '#bio' }))
    .toBe('/user/42?tag=a&tag=b#bio')
})

test('protects declared query keys, including omitted optional params', () => {
  const route = createUrl({ path: '/user', query: 'tab=[tab]&sort=[?sort]' })

  expect(createCanonicalUrl(route, { tab: 'posts' }, { query: 'tab=comments&sort=asc&debug=true' }))
    .toBe('/user?tab=posts&debug=true')
})

test('protects the declared hash', () => {
  const route = createUrl({ path: '/user', hash: 'profile/[id]' })

  expect(createCanonicalUrl(route, { id: '42' }, { hash: '#about' })).toBe('/user#profile/42')
})
