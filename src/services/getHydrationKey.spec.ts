import { expect, test } from 'vitest'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRoute } from '@/services/createRoute'
import { getDataKey, GetDataKeyOptions } from '@/services/getDataKey'
import { getHydrationKey } from '@/services/getHydrationKey'

test('ignores hash and state when matching data keys for hydration', () => {
  const route = createRoute({ name: 'product', path: '/products/[id]', state: { tab: String } })
  const server = createResolvedRoute(route, { id: '42' })
  const client = createResolvedRoute(route, { id: '42' }, { hash: 'reviews', state: { tab: 'reviews' } })
  const serverKey = getDataKey({ route: server, depth: 0, kind: 'loader', name: 'default' })
  const clientKey = getDataKey({ route: client, depth: 0, kind: 'loader', name: 'default' })

  expect(clientKey).not.toBe(serverKey)
  expect(getHydrationKey(clientKey)).toBe(getHydrationKey(serverKey))
})

test('preserves the destination and computation identity', () => {
  const route = createRoute({ name: 'product', path: '/products/[id]' })
  const resolved = createResolvedRoute(route, { id: '42' })
  const options: GetDataKeyOptions = { route: resolved, depth: 0, kind: 'loader', name: 'default' }
  const variations: GetDataKeyOptions[] = [
    options,
    { ...options, route: createResolvedRoute(route, { id: '43' }) },
    { ...options, route: createResolvedRoute(route, { id: '42' }, { query: { q: 'reviews' } }) },
    { ...options, route: createResolvedRoute(route, { id: '42' }, { query: { q: '#reviews' } }) },
    { ...options, route: createResolvedRoute(createRoute({ name: 'other', path: '/products/42' })) },
    { ...options, depth: 1 },
    { ...options, kind: 'props' },
    { ...options, name: 'other' },
  ]
  const keys = variations.map((options) => getHydrationKey(getDataKey(options)))

  expect(keys).not.toContain(undefined)
  expect(new Set(keys).size).toBe(variations.length)
})

test.each(['not json', 'null', '[]', '["product",null,[],0,"loader","default"]'])('ignores an invalid payload key: %s', (key) => {
  expect(getHydrationKey(key)).toBeUndefined()
})
