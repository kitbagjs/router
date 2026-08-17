import { describe, expect, test } from 'vitest'
import { createNavigationStores } from './createNavigationStores'
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
