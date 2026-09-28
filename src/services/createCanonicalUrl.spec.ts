import { expect, test } from 'vitest'
import { asUrlString } from '@/types/urlString'
import { createUrl } from '@/services/createUrl'
import { createCanonicalUrl } from '@/services/createCanonicalUrl'

const alias = {
  url: createUrl({
    path: '/member',
  }),
  params: {},
}

test('carries extra query values and hash, retaining repeated values', () => {
  const route = createUrl({
    path: '/user/[id]',
  })

  expect(createCanonicalUrl(asUrlString('/member?tag=a&tag=b#bio'), {
    route,
    params: { id: '42' },
    alias,
  }))
    .toBe('/user/42?tag=a&tag=b#bio')
})

test('protects declared query keys, including omitted optional params', () => {
  const route = createUrl({
    path: '/user',
    query: 'tab=[tab]&sort=[?sort]',
  })

  expect(createCanonicalUrl(asUrlString('/member?tab=comments&sort=asc&debug=true'), {
    route,
    params: { tab: 'posts' },
    alias,
  }))
    .toBe('/user?tab=posts&debug=true')
})

test('protects the declared hash', () => {
  const route = createUrl({
    path: '/user',
    hash: 'profile/[id]',
  })

  expect(createCanonicalUrl(asUrlString('/member#about'), {
    route,
    params: { id: '42' },
    alias,
  })).toBe('/user#profile/42')
})

test('normal routes preserve the same query and hash overrides as href', () => {
  const route = createUrl({
    path: '/user',
    query: 'tab=posts',
    hash: 'profile',
  })

  expect(createCanonicalUrl(asUrlString('/user?tab=posts&tab=comments#about'), {
    route,
    params: {},
  }))
    .toBe('/user?tab=posts&tab=comments#about')
})
