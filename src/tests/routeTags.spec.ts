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

test('a failed parent also fails a dependent child while preserving successful ancestor tags', async () => {
  const error = new Error('parent failed')
  const grandparent = createRoute({ path: '/' }).setTags((tags) => tags.title.set('Grandparent'))
  const parent = createRoute({ parent: grandparent, path: 'parent' }).setTags((tags) => {
    tags.title.set('Partial')
    throw error
  })
  const route = createResolvedRoute(createRoute({ parent, path: 'child' }).setTags(async (tags) => {
    tags.title.set(`${await tags.title.get()} - Child`)
  }))
  const navigation = createRouterNavigation()
  onTestFinished(() => navigation.stop())

  await Promise.all(navigation.commit({ to: route, from: null }))

  await expect(navigation.getValue({ kind: 'tags', depth: 0, name: 'tags' }, route)).resolves.toMatchObject([
    { kind: 'set', groups: [{ value: 'Grandparent' }] },
  ])
  await expect(navigation.getValue({ kind: 'tags', depth: 1, name: 'tags' }, route)).rejects.toBe(error)
  await expect(navigation.getValue({ kind: 'tags', depth: 2, name: 'tags' }, route)).rejects.toBe(error)
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
