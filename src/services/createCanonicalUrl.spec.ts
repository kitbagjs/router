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

  const url = asUrlString('/member?tag=a&tag=b#bio')
  const canonical = createCanonicalUrl(url, {
    route,
    params: { id: '42' },
    alias,
  })

  expect(canonical).toBe('/user/42?tag=a&tag=b#bio')
})

test('protects declared query keys, including omitted optional params', () => {
  const route = createUrl({
    path: '/user',
    query: 'tab=[tab]&sort=[?sort]',
  })

  const url = asUrlString('/member?tab=comments&sort=asc&debug=true')
  const canonical = createCanonicalUrl(url, {
    route,
    params: { tab: 'posts' },
    alias,
  })

  expect(canonical).toBe('/user?tab=posts&debug=true')
})

test('protects the declared hash', () => {
  const route = createUrl({
    path: '/user',
    hash: 'profile/[id]',
  })

  const url = asUrlString('/member#about')
  const canonical = createCanonicalUrl(url, {
    route,
    params: { id: '42' },
    alias,
  })

  expect(canonical).toBe('/user#profile/42')
})

test('normal routes preserve the same query and hash overrides as href', () => {
  const route = createUrl({
    path: '/user',
    query: 'tab=posts',
    hash: 'profile',
  })

  const url = asUrlString('/user?tab=posts&tab=comments#about')
  const canonical = createCanonicalUrl(url, {
    route,
    params: {},
  })

  expect(canonical).toBe('/user?tab=posts&tab=comments#about')
})
