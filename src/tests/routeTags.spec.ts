import { expect, onTestFinished, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { getComputations } from '@/services/getComputations'
import * as waitingWarnings from '@/services/warnWaitingOnUncomputedValue'

test('prefetched child tags inherit their pending parent instead of the previous navigation layer', async () => {
  let title = Promise.resolve('Original')
  const parent = createRoute({ path: '/' }).setTags(async (tags) => tags.title.set(await title))
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }).setTags(async (tags) => {
    tags.title.set(`${await tags.title.get()} - Child`)
  }))
  const navigation = createRouterNavigation()
  const prepared = navigation.create()
  onTestFinished(() => {
    prepared.dispose()
    navigation.stop()
  })
  await Promise.all(navigation.commit({ to: route, from: null }))

  const pending = Promise.withResolvers<string>()
  title = pending.promise
  const work = prepared.compute(route, getComputations(route))
  const child = { kind: 'tags', depth: 1, name: 'tags' } as const
  await flushPromises()

  expect(prepared.getState(child, route)).toEqual({ status: 'RUNNING' })
  pending.resolve('Updated')
  await Promise.all(work)
  await Promise.all(prepared.commit({ to: route, from: route }))

  await expect(navigation.getValue(child, route)).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Updated - Child' }] },
  ])
})

test('repeated inherited reads skip a failed parent in the current navigation during child-only prefetch', async () => {
  const parent = createRoute({ path: '/' }).setTags((tags) => {
    tags.title.set('Partial')
    throw new Error('parent failed')
  })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }).setTags(async (tags) => {
    const [first, second] = await Promise.all([tags.title.get(), tags.title.get()])

    expect(first).toBeUndefined()
    expect(second).toBeUndefined()
    tags.title.set('Fallback')
  }))
  const navigation = createRouterNavigation()
  const prepared = navigation.create()
  onTestFinished(() => {
    prepared.dispose()
    navigation.stop()
  })
  await Promise.all(navigation.commit({ to: route, from: null }))
  const child = getComputations(route).filter(({ kind, depth }) => kind === 'tags' && depth === 1)
  await Promise.all(prepared.compute(route, child))

  await expect(prepared.getValue(child[0], route)).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Fallback' }] },
  ])
})

test('child-only prefetch can wait for ancestor tags that start when navigation commits', async () => {
  const warn = vi.spyOn(waitingWarnings, 'warnWaitingOnUncomputedValue').mockImplementation(() => {})
  onTestFinished(() => warn.mockRestore())
  const parent = createRoute({ path: '/' }).setTags((tags) => tags.title.set('Parent'))
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }).setTags(async (tags) => {
    tags.title.set(`${await tags.title.get()} - Child`)
  }))
  const navigation = createRouterNavigation()
  const prepared = navigation.create()
  onTestFinished(() => {
    prepared.dispose()
    navigation.stop()
  })
  const child = getComputations(route).filter(({ kind, depth }) => kind === 'tags' && depth === 1)
  const work = prepared.compute(route, child)

  expect(prepared.getState(child[0], route)).toEqual({ status: 'RUNNING' })
  expect(warn).toHaveBeenCalledExactlyOnceWith({ kind: 'tags', depth: 0, name: 'tags' }, route)
  await Promise.all(prepared.commit({ to: route, from: null }))
  await Promise.all(work)

  await expect(navigation.getValue(child[0], route)).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Parent - Child' }] },
  ])
})
