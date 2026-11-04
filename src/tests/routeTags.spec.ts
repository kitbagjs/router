import { expect, onTestFinished, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { getComputations } from '@/services/getComputations'
import { decodePayloadValues, encodePayloadValues } from '@/services/payload'
import { Tags } from '@/types/tags'
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

test('child-only prefetch skips a failed parent without adopting its partial writes', async () => {
  const inherited = vi.fn()
  const parent = createRoute({ path: '/' }).setTags((tags) => {
    tags.title.set('Partial')
    throw new Error('parent failed')
  })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }).setTags(async (tags) => {
    inherited(await tags.title.get())
    tags.title.set('Fallback')
  }))
  const navigation = createRouterNavigation()
  const prepared = navigation.create()
  onTestFinished(() => {
    prepared.dispose()
    navigation.stop()
  })
  await Promise.all(navigation.commit({ to: route, from: null }))
  inherited.mockClear()
  const child = getComputations(route).filter(({ kind, depth }) => kind === 'tags' && depth === 1)
  await Promise.all(prepared.compute(route, child))

  expect(inherited).toHaveBeenCalledExactlyOnceWith(undefined)

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

test('hydration reuses serialized tag operations without rerunning the callback', async () => {
  const callback = vi.fn((tags: Tags) => {
    tags.meta.add({
      property: 'og:image',
      content: '/image.jpg',
      related: [{ property: 'og:image:alt', content: 'Image' }],
    })
    tags.meta.delete({ name: 'description' })
  })
  const definition = createRoute({ path: '/' }).setTags(callback)
  const serverRoute = createResolvedRoute(definition)
  const server = createRouterNavigation()
  await Promise.all(server.commit({ to: serverRoute, from: null }))
  const { values } = encodePayloadValues(serverRoute, server.getEntries())
  const payload = JSON.parse(JSON.stringify({ kind: 'success', url: '/', values }))

  const clientRoute = createResolvedRoute(definition)
  const client = createRouterNavigation()
  onTestFinished(() => {
    client.stop()
    server.stop()
  })
  const prepared = client.create()
  prepared.setEntries(decodePayloadValues(clientRoute, payload.values))
  await Promise.all(prepared.commit({ to: clientRoute, from: null }))
  const location = { kind: 'tags', depth: 0, name: 'tags' } as const

  expect(await client.getValue(location, clientRoute)).toEqual(await server.getValue(location, serverRoute))
  expect(callback).toHaveBeenCalledOnce()
})

test('setTags can await destination loader data', async () => {
  const route = createResolvedRoute(createRoute({ path: '/' })
    .addLoader(async () => 'Product')
    .setTags(async (tags, { to }) => tags.title.set(await to.getData())))
  const navigation = createRouterNavigation()
  onTestFinished(() => navigation.stop())

  await Promise.all(navigation.commit({ to: route, from: null }))

  await expect(navigation.getValue({ kind: 'tags', depth: 0, name: 'tags' }, route)).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Product' }] },
  ])
})

test('a tag callback failure reaches onError with a tags source', async () => {
  const error = new Error('tags failed')
  const home = createRoute({ name: 'home', path: '/' })
  const page = createRoute({ name: 'page', path: '/page' }).setTags(async () => {
    throw error
  })
  const router = createRouter([home, page], { initialUrl: '/' })
  const onError = vi.fn()
  onTestFinished(() => router.stop())
  router.onError(onError)

  await router.start()
  await router.push('/page')
  await flushPromises()

  expect(onError).toHaveBeenCalledExactlyOnceWith(error, expect.objectContaining({ source: 'tags' }))
})
