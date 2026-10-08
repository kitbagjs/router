import { createApp, defineAsyncComponent } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { WithData } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'

test('a rejection enters through after hooks without changing the route API or its URL lookup', async () => {
  const route = createRoute({ name: 'home', path: '/', component })
  const denied = createRejection({ type: 'Denied', component })
  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory', rejections: [denied] })
  const app = createApp(component)

  app.use(router)

  const { useRejection } = createRouterAssets(router)
  const rejection = app.runWithContext(useRejection)
  const calls: string[] = []
  const finished = Promise.withResolvers<void>()

  await router.start()

  route.onBeforeRouteLeave((to, { from }) => {
    expect(to).toBeNull()
    expect(from.name).toBe('home')
    calls.push('before leave')
  })
  route.onAfterRouteLeave((to, { from }) => {
    expect(to).toBeNull()
    expect(from.name).toBe('home')
    calls.push('after leave')
  })
  denied.onRejection(async (type) => {
    expect(type).toBe('Denied')
    expect(rejection.value).toBe(denied)
    calls.push('rejected')
    await finished.promise
    calls.push('finished')
  })

  const navigation = router.reject('Denied')

  await flushPromises()

  expect(calls).toEqual(['before leave', 'after leave', 'rejected'])
  expect(router.route.name).toBe('home')
  expect(router.route.href).toBe('/')
  expect(router.find('/')?.name).toBe('home')
  expect(denied.type).toBe('Denied')

  finished.resolve()
  await navigation

  expect(calls).toEqual(['before leave', 'after leave', 'rejected', 'finished'])

  const entered = vi.fn()

  route.onAfterRouteEnter(entered)
  await router.push('/')

  expect(rejection.value).toBeNull()
  expect(entered).toHaveBeenCalledWith(expect.objectContaining({ name: 'home' }), expect.objectContaining({ from: null }))
  // A rejection page has no route to leave; the last successful route must not leave a second time.
  expect(calls.filter((call) => call === 'before leave')).toHaveLength(1)
})

test.each(['missing', 'manual'] as const)('%s rejection runs leave hooks and completes progress', async (kind) => {
  const route = createRoute({ name: 'home', path: '/', component })
  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory' })
  const app = createApp(component)

  app.use(router)

  const { useNavigation, useRejection } = createRouterAssets(router)
  const progress = app.runWithContext(useNavigation)
  const rejection = app.runWithContext(useRejection)
  const before = Promise.withResolvers<void>()
  const after = vi.fn()

  await router.start()

  route.onBeforeRouteLeave(() => before.promise)
  route.onAfterRouteLeave(after)

  const navigation = kind === 'missing' ? router.push('/missing') : router.reject('NotFound')

  expect(progress.pending.value).toBe(true)
  expect(rejection.value).toBeNull()

  before.resolve()
  await navigation

  expect(after).toHaveBeenCalledOnce()
  expect(after).toHaveBeenCalledWith(null, expect.objectContaining({ from: expect.objectContaining({ name: 'home' }) }))
  expect(rejection.value).toEqual(expect.objectContaining({ type: 'NotFound' }))
  expect(progress.pending.value).toBe(false)
  expect(progress.total.value).toBe(progress.settled.value)
})

test('a new page cancels a pending rejection after hook and ignores its late failure', async () => {
  const route = createRoute({ name: 'home', path: '/', component })
  const denied = createRejection({ type: 'Denied', component })
  const pending = Promise.withResolvers<void>()
  const onError = vi.fn()

  denied.onRejection(() => pending.promise)

  const router = createRouter([route], { initialUrl: '/', historyMode: 'memory', rejections: [denied] })

  router.onError(onError)
  await router.start()

  const rejected = router.reject('Denied')

  await flushPromises()
  await router.push('/')
  await rejected

  pending.reject(new Error('too late'))
  await flushPromises()

  expect(onError).not.toHaveBeenCalled()
  expect(router.route.name).toBe('home')
})

test('rejection components count as navigation assets', async () => {
  const loaded = Promise.withResolvers<typeof component>()
  const denied = createRejection({ type: 'Denied', component: defineAsyncComponent(() => loaded.promise) })
  const router = createRouter([], { initialUrl: '/', historyMode: 'memory', rejections: [denied] })
  const app = createApp(component)

  app.use(router)

  const { useNavigation } = createRouterAssets(router)
  const progress = app.runWithContext(useNavigation)

  await router.start()
  await router.reject('Denied')

  expect(progress.pending.value).toBe(true)
  expect(progress.total.value).toBe(1)

  loaded.resolve(component)
  await flushPromises()

  expect(progress.pending.value).toBe(false)
  expect(progress.settled.value).toBe(1)
})

test('after leave hooks retain the data of the route that was actually displayed', async () => {
  const first = createRoute({ name: 'first', path: '/', component }).addLoader(() => 'first data')
  const second = createRoute({ name: 'second', path: '/second', component }).addLoader(() => 'second data')
  const router = createRouter([first, second], { initialUrl: '/', historyMode: 'memory' })
  const left = vi.fn()

  first.onAfterRouteLeave(async (_to, { from }) => left(await (from as typeof from & WithData).data))

  await router.start()
  await router.push('second')

  expect(left).toHaveBeenCalledWith('first data')
})

test('writing useRejection follows the same navigation path and clearing it restores route values', async () => {
  const home = createRoute({ name: 'home', path: '/', component }).addLoader(() => 'data')
  const denied = createRejection({ type: 'Denied', component })
  const router = createRouter([home], { initialUrl: '/', historyMode: 'memory', rejections: [denied] })
  const app = createApp(component)

  app.use(router)

  const { useRejection } = createRouterAssets(router)
  const rejection = app.runWithContext(useRejection)
  const onRejection = vi.fn()

  router.onRejection(onRejection)
  await router.start()

  rejection.value = denied
  await flushPromises()

  expect(onRejection).toHaveBeenCalledOnce()
  expect(rejection.value).toBe(denied)

  rejection.value = null
  await flushPromises()

  expect(rejection.value).toBeNull()
  await expect(router.route.data).resolves.toBe('data')
})

test('a rejection preserves the history entry and its route state', async () => {
  const home = createRoute({ name: 'home', path: '/home', component, state: { count: Number } })
  const other = createRoute({ name: 'other', path: '/other', component })
  const router = createRouter([home, other], { initialUrl: '/home', historyMode: 'memory' })

  await router.start()
  await router.replace('home', {}, { state: { count: 42 } })
  await router.reject('NotFound')
  await router.push('other')
  router.back()
  await flushPromises()

  expect(router.route.name).toBe('home')
  expect(router.route.href).toBe('/home')
  expect(router.route.state).toEqual({ count: 42 })
})

test('a server redirect cancels the other before hooks', async () => {
  const seen = Promise.withResolvers<AbortSignal>()
  const home = createRoute({ name: 'home', path: '/', component })

  home.onBeforeRouteEnter((_to, { signal }) => {
    seen.resolve(signal)
    return new Promise(() => {})
  })
  home.onBeforeRouteEnter((_to, { push }) => push('/next'))

  const router = createRouter([home], { initialUrl: '/', ssr: true })
  const response = await router.render()

  expect(response.kind).toBe('redirect')
  expect((await seen.promise).aborted).toBe(true)
})
