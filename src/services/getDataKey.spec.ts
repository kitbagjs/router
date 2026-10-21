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
