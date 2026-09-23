import { describe, expect, test } from 'vitest'
import { createNavigationStores, getDataKey } from './createNavigationStores'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createParam } from '@/services/createParam'
import { withParams } from '@/services/withParams'
import { createDataStore } from './createDataStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

describe('promote', () => {
  test('adopts the staged store', () => {
    const stores = createNavigationStores()
    const staged = createDataStore()

    stores.stage(staged)
    stores.promote()

    expect(stores.current()).toBe(staged)
  })

  test('starts a fresh store when nothing was staged', () => {
    const stores = createNavigationStores()
    const before = stores.current()

    stores.promote()

    expect(stores.current()).not.toBe(before)
  })

  test('hands back the store it replaced', () => {
    const stores = createNavigationStores()
    const before = stores.current()

    expect(stores.promote()).toBe(before)
  })

  test('only adopts a staged store once', () => {
    const stores = createNavigationStores()
    const staged = createDataStore()

    stores.stage(staged)
    stores.promote()
    stores.promote()

    expect(stores.current()).not.toBe(staged)
  })
})

describe('stage', () => {
  test('disposes a store it displaces, so anything waiting on it resumes', async () => {
    const stores = createNavigationStores()
    const displaced = createDataStore()
    const waiting = displaced.subscribe('key')

    stores.stage(displaced)
    stores.stage(createDataStore())

    await expect(waiting).rejects.toThrow(NavigationAbandonedError)
  })
})

describe('staged', () => {
  test('creates the staged store when nothing was staged', () => {
    const stores = createNavigationStores()

    const store = stores.staged()

    stores.promote()

    expect(stores.current()).toBe(store)
  })

  test('hands back the store a link staged', () => {
    const stores = createNavigationStores()
    const store = createDataStore()

    stores.stage(store)

    expect(stores.staged()).toBe(store)
  })

  test('hands back the same store until it is promoted', () => {
    const stores = createNavigationStores()

    expect(stores.staged()).toBe(stores.staged())
  })
})

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

  test('includes the query and ignores the hash', () => {
    const route = createRoute({ name: 'search', path: '/search' })
    const plain = createResolvedRoute(route)
    const withQuery = createResolvedRoute(route, {}, { query: { q: 'cats' } })
    const withHash = createResolvedRoute(route, {}, { hash: 'results' })

    expect(getDataKey('props', 'id', 'name', withQuery)).not.toBe(getDataKey('props', 'id', 'name', plain))
    expect(getDataKey('props', 'id', 'name', withHash)).toBe(getDataKey('props', 'id', 'name', plain))
  })
})
