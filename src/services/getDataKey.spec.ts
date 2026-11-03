import { describe, expect, test } from 'vitest'
import { getDataKey } from './getDataKey'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createParam } from '@/services/createParam'
import { withParams } from '@/services/withParams'

describe('getDataKey', () => {
  test('does not throw for a bigint param', () => {
    const bigint = createParam({ get: (value) => BigInt(value), set: (value) => String(value) })
    const route = createRoute({ name: 'item', path: withParams('/item/[id]', { id: bigint }) })

    expect(() => getDataKey('loader', 'id', 'name', createResolvedRoute(route, { id: 123n }))).not.toThrow()
  })

  test('gives different set values different keys', () => {
    const set = createParam({
      get: (value) => new Set(value.split(',')),
      set: (value) => Array.from(value).join(','),
    })
    const route = createRoute({ name: 'item', path: withParams('/item/[ids]', { ids: set }) })

    const a = getDataKey('props', 'id', 'name', createResolvedRoute(route, { ids: new Set(['a']) }))
    const b = getDataKey('props', 'id', 'name', createResolvedRoute(route, { ids: new Set(['b']) }))

    expect(a).not.toBe(b)
  })

  test('includes the query and hash, since callbacks can read them', () => {
    const route = createRoute({ name: 'search', path: '/search' })
    const plain = createResolvedRoute(route)
    const withQuery = createResolvedRoute(route, {}, { query: { q: 'cats' } })
    const withHash = createResolvedRoute(route, {}, { hash: 'results' })

    expect(getDataKey('props', 'id', 'name', withQuery)).not.toBe(getDataKey('props', 'id', 'name', plain))
    expect(getDataKey('props', 'id', 'name', withHash)).not.toBe(getDataKey('props', 'id', 'name', plain))
  })
})

test('the same route structure produces the same keys despite different generated ids', () => {
  const serverParent = createRoute({ path: '/users' })
  const server = createResolvedRoute(createRoute({ parent: serverParent, name: 'user', path: '[id]' }), { id: '42' })
  createRoute({ path: '/unrelated' })
  const clientParent = createRoute({ path: '/users' })
  const client = createResolvedRoute(createRoute({ parent: clientParent, name: 'user', path: '[id]' }), { id: '42' })

  expect(server.id).not.toBe(client.id)
  expect(getDataKey('props', serverParent.id, 'default', server)).toBe(getDataKey('props', clientParent.id, 'default', client))
  expect(getDataKey('loader', server.id, 'user', server)).toBe(getDataKey('loader', client.id, 'user', client))
})

test('distinguishes owning matches, kinds, names, and destination routes', () => {
  const parent = createRoute({ path: '/' })
  const first = createResolvedRoute(createRoute({ parent, name: 'first', path: 'page' }))
  const second = createResolvedRoute(createRoute({ parent, name: 'second', path: 'page' }))
  const keys = [
    getDataKey('props', parent.id, 'default', first),
    getDataKey('props', first.id, 'default', first),
    getDataKey('loader', first.id, 'default', first),
    getDataKey('loader', first.id, 'other', first),
    getDataKey('props', parent.id, 'default', second),
  ]

  expect(new Set(keys).size).toBe(keys.length)
})

test('includes serialized state from both parent and child matches', () => {
  const parent = createRoute({ path: '/', state: { locale: String } })
  const route = createRoute({ parent, name: 'page', path: 'page', state: { page: Number } })
  const first = createResolvedRoute(route, {}, { state: { locale: 'en', page: 1 } })
  const changedParent = createResolvedRoute(route, {}, { state: { locale: 'fr', page: 1 } })
  const changedChild = createResolvedRoute(route, {}, { state: { locale: 'en', page: 2 } })
  const key = getDataKey('loader', route.id, 'default', first)

  expect(getDataKey('loader', route.id, 'default', changedParent)).not.toBe(key)
  expect(getDataKey('loader', route.id, 'default', changedChild)).not.toBe(key)
})

test('uses state serializers and ignores state declaration order', () => {
  const date = createParam({ get: (value) => new Date(value), set: (value) => value.toISOString() })
  const serverRoute = createRoute({ name: 'page', path: '/', state: { date, page: Number } })
  const clientRoute = createRoute({ name: 'page', path: '/', state: { page: Number, date } })
  const server = createResolvedRoute(serverRoute, {}, { state: { date: new Date('2026-01-01'), page: 1 } })
  const client = createResolvedRoute(clientRoute, {}, { state: { page: 1, date: '2026-01-01T00:00:00.000Z' } })

  expect(getDataKey('loader', server.id, 'default', server)).toBe(getDataKey('loader', client.id, 'default', client))
})

test('unattached loader keys remain distinct', () => {
  const route = createResolvedRoute(createRoute({ name: 'home', path: '/' }))

  expect(getDataKey('loader', 'fallback-1', 'default', route)).not.toBe(getDataKey('loader', 'fallback-2', 'default', route))
})
