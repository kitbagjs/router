/* eslint-disable @typescript-eslint/no-deprecated -- Keep legacy route.data compatibility coverage until removal. */
import { expect, test, vi } from 'vitest'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { isLoader } from '@/types/loader'
import { createRejection } from '@/services/createRejection'
import { isSameLoader } from '@/services/isSameLoader'

test('one definition loads independently for multiple routes', async () => {
  const loader = createLoader({
    load: async (route) => `${route.name}-${route.params.id}`,
  })
  const first = createRoute({ name: 'first', path: '/first/[id]' }).addLoader(loader)
  const second = createRoute({ name: 'second', path: '/second/[id]' }).addLoader(loader)
  const router = createRouter([first, second], { initialUrl: '/first/1' })

  await router.start()
  await expect(router.route.data).resolves.toBe('first-1')
  await router.push('second', { id: '2' })
  await expect(router.route.data).resolves.toBe('second-2')
})

test('attachment preserves loader identity while overriding defaults', () => {
  const transformer = { stringify: String, parse: Number }
  const overrideTransformer = { stringify: JSON.stringify, parse: JSON.parse }
  const loader = createLoader({ load: () => 1, prefetch: 'eager', transformer })
  const overridden = createRoute({ path: '/' }).addLoader(loader, {
    prefetch: false,
    transformer: overrideTransformer,
  })
  const defaults = createRoute({ path: '/' }).addLoader(loader)

  expect(isLoader(overridden.matches[0].loaders.default)).toBe(true)
  expect(isLoader(defaults.matches[0].loaders.default)).toBe(true)
  expect(isSameLoader(loader, overridden.matches[0].loaders.default)).toBe(true)
  expect(isSameLoader(loader, defaults.matches[0].loaders.default)).toBe(true)
  expect(isSameLoader(loader, createLoader({ load: loader.load }))).toBe(false)
  expect(overridden.matches[0].loaders.default).toMatchObject({ prefetch: false, transformer: overrideTransformer })
  expect(defaults.matches[0].loaders.default).toMatchObject({ prefetch: 'eager', transformer })
})

test('loader context registers navigation targets and rejections through chained attachments', async () => {
  const denied = createRejection({ type: 'Denied' })
  const rejectLoader = createLoader({ context: [denied], load: (_route, { reject }) => reject('Denied') })
  const target = createRoute({ name: 'target', path: '/target' }).addLoader(rejectLoader)
  const redirectLoader = createLoader({ context: [target], load: (_route, { push }) => push('target') })
  const route = createRoute({ name: 'source', path: '/' }).addLoader(redirectLoader)
    .addLoader(() => 1, { name: 'other' })
  const router = createRouter([route], { initialUrl: '/' })
  const onRejection = vi.fn()
  router.onRejection(onRejection)

  await router.start()
  await vi.waitFor(() => expect(onRejection).toHaveBeenCalledWith('Denied', expect.anything()))
  expect(router.route.name).toBe('target')
})

test('replacing a loader preserves context targets available to route callbacks', async () => {
  const target = createRoute({ name: 'target', path: '/target' })
  const loader = createLoader({ context: [target], load: () => 1 })
  const source = createRoute({ name: 'source', path: '/' }).addLoader(loader)
    .addLoader(() => 2)
  source.onBeforeRouteEnter((_to, { push }) => push('target'))
  const router = createRouter([source], { initialUrl: '/' })

  await router.start()
  expect(router.route.name).toBe('target')
})

test('redirect discovery retains the context of chained loaders', async () => {
  const dependency = createRoute({ name: 'dependency', path: '/dependency' })
  const target = createRoute({ name: 'target', path: '/target' })
  const loader = createLoader({ context: [dependency], load: () => 1 })
  const source = createRoute({ name: 'source', path: '/source' }).addLoader(loader)
  source.redirectTo(target)
  const router = createRouter([target], { initialUrl: '/source' })

  await router.start()
  expect(router.route.name).toBe('target')
  expect(router.find('/dependency')?.name).toBe('dependency')
})
