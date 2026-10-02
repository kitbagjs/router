import { defineAsyncComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { mockNavigation } from '@/tests/mockNavigation'
import { payloadToScript } from '@/services/payload'
import { createBrowserNavigation } from '@/services/createBrowserNavigation'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- Preserve the inferred route and rejection types.
function createTestRouter() {
  const home = createRoute({
    name: 'home',
    path: '/',
    component: { template: '<div>home</div>' },
  })
  const first = createRoute({
    name: 'first',
    path: '/first',
    state: { visit: Number },
    component: { template: '<div>first</div>' },
  })
  const second = createRoute({
    name: 'second',
    path: '/second',
    component: { template: '<div>second</div>' },
  })
  const locked = createRejection({
    type: 'Locked',
    component: { template: '<div>locked</div>' },
  })

  return createRouter([home, first, second], { rejections: [locked] })
}

describe('browser navigation', () => {
  let native: ReturnType<typeof mockNavigation>
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    window.history.replaceState(null, '', '/')
    native = mockNavigation()
    router = createTestRouter()
    await router.start()
  })

  afterEach(() => {
    router.stop()
  })

  test('guards run before the URL or route changes', async () => {
    const guard = Promise.withResolvers<undefined>()
    const entered = Promise.withResolvers<undefined>()

    router.onBeforeRouteEnter(() => {
      entered.resolve(undefined)
      return guard.promise
    })

    const navigation = router.push('first')

    await entered.promise

    expect(window.location.pathname).toBe('/')
    expect(router.route.name).toBe('home')

    guard.resolve(undefined)
    await navigation

    expect(window.location.pathname).toBe('/first')
    expect(router.route.name).toBe('first')
  })

  test.each(['push', 'replace'] as const)('aborted %s preserves the current entry and forward entries', async (method) => {
    await router.push('first')
    await router.push('second')
    await native.back().finished

    const entries = native.entries()
    const current = native.currentEntry

    router.onBeforeRouteEnter((_to, { abort }) => abort())
    await router[method]('/second')

    expect(native.entries()).toEqual(entries)
    expect(native.currentEntry).toBe(current)
    expect(window.location.pathname).toBe('/first')
    expect(router.route.name).toBe('first')
  })

  test('an accepted replace keeps the forward entries', async () => {
    await router.push('first')
    await router.push('second')
    const second = native.currentEntry

    await native.back().finished
    await router.replace('/first', { state: { visit: 9 } })

    expect(native.canGoForward).toBe(true)
    expect(native.entries().at(-1)).toBe(second)
    await native.forward().finished
    expect(router.route.name).toBe('second')
  })

  test('aborted traversal keeps its URL, state and entry without a restoration navigation', async () => {
    await router.push('first', {}, { state: { visit: 1 } })
    await router.push('first', {}, { state: { visit: 2 } })

    const current = native.currentEntry
    const before = vi.fn((_to, { abort }) => abort())

    router.onBeforeRouteUpdate(before)
    router.back()
    await flushPromises()

    expect(before).toHaveBeenCalledOnce()
    expect(native.currentEntry).toBe(current)
    expect(native.currentEntry.getState()).toEqual({ visit: '2' })
    expect(router.route.state).toEqual({ visit: 2 })
  })

  test('a precommit redirect runs the destination guards without committing the intermediate URL', async () => {
    const destinations: string[] = []
    const addresses: string[] = []

    router.onBeforeRouteEnter((to, { push }) => {
      destinations.push(to.name)
      addresses.push(window.location.pathname)

      if (to.name === 'first') {
        push('second')
      }
    })

    await router.push('first')

    expect(destinations).toEqual(['first', 'second'])
    expect(addresses).toEqual(['/', '/'])
    expect(native.entries().map((entry) => new URL(entry.url).pathname)).toEqual(['/', '/second'])
    expect(router.route.name).toBe('second')
  })

  test('native navigations initiated outside the router use the same guards and rendering', async () => {
    const before = vi.fn()

    router.onBeforeRouteEnter(before)
    await native.navigate('/first', { state: { visit: 3 } }).finished

    expect(before).toHaveBeenCalledOnce()
    expect(router.route.name).toBe('first')
    expect(router.route.state).toEqual({ visit: 3 })
  })

  test('a rejection renders after the destination URL commits', async () => {
    const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

    router.onBeforeRouteEnter((_to, { reject }) => reject('Locked'))
    await router.push('first')

    expect(window.location.pathname).toBe('/first')
    expect(wrapper.text()).toBe('locked')
    expect(router.route.name).toBe('home')

    wrapper.unmount()
  })

  test('a superseded guard cannot commit after the newer navigation', async () => {
    const guard = Promise.withResolvers<undefined>()
    const entered = Promise.withResolvers<undefined>()

    router.onBeforeRouteEnter((to) => {
      if (to.name === 'first') {
        entered.resolve(undefined)
        return guard.promise
      }
    })

    const first = router.push('first')

    await entered.promise
    await router.push('second')
    await first

    guard.resolve(undefined)
    await flushPromises()

    expect(window.location.pathname).toBe('/second')
    expect(router.route.name).toBe('second')
  })

  test('a traversal redirect starts a new native navigation before the traversal commits', async () => {
    await router.push('first')
    await router.push('second')

    const observed: string[] = []
    router.onBeforeRouteEnter((to, { replace }) => {
      observed.push(window.location.pathname)

      if (to.name === 'first') {
        replace('home')
      }
    })

    router.back()
    await flushPromises()

    expect(observed).toEqual(['/second', '/second'])
    expect(window.location.pathname).toBe('/')
    expect(router.route.name).toBe('home')
  })

  test('stopping during a guard settles the navigation without committing', async () => {
    const entered = Promise.withResolvers<AbortSignal>()

    router.onBeforeRouteEnter((_to, { signal }) => {
      entered.resolve(signal)
      return new Promise(() => {})
    })

    const navigation = router.push('first')
    const signal = await entered.promise

    router.stop()
    await navigation

    expect(signal.aborted).toBe(true)
    expect(window.location.pathname).toBe('/')
    expect(router.route.name).toBe('home')
  })
})

test('the handler waits for props, loaders, lazy components and Vue rendering while after hooks run', async () => {
  window.history.replaceState(null, '', '/')
  mockNavigation()
  const props = Promise.withResolvers<{ value: string }>()
  const loader = Promise.withResolvers<string>()
  const component = Promise.withResolvers<undefined>()
  const after = Promise.withResolvers<undefined>()
  const home = createRoute({ name: 'home', path: '/' })
  const slow = createRoute({
    name: 'slow',
    path: '/slow',
    component: defineAsyncComponent(async () => {
      await component.promise

      return { props: ['value'], template: '<div>{{ value }}</div>' }
    }),
  }, () => props.promise).addLoader(() => loader.promise)
  const router = createRouter([home, slow])
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })

  await router.start()
  router.onAfterRouteEnter(() => {
    after.resolve(undefined)
  })

  let finished = false
  const navigation = router.push('slow').then(() => {
    finished = true
  })

  await after.promise

  expect(window.location.pathname).toBe('/slow')
  expect(finished).toBe(false)

  props.resolve({ value: 'loaded props' })
  component.resolve(undefined)
  await flushPromises()

  expect(finished).toBe(false)

  loader.resolve('loaded data')
  await navigation

  expect(wrapper.text()).toBe('loaded props')
  await expect(router.route.data).resolves.toBe('loaded data')

  router.stop()
  wrapper.unmount()
})

test('an explicit initial URL uses native replace when it differs from the document URL', async () => {
  window.history.replaceState(null, '', '/')
  const native = mockNavigation()
  const first = createRoute({ name: 'first', path: '/first' })
  const router = createRouter([first], { initialUrl: '/first' })

  await router.start()

  expect(window.location.pathname).toBe('/first')
  expect(router.route.name).toBe('first')
  expect(native.navigate).toHaveBeenCalledWith('/first', { history: 'replace', state: undefined })

  router.stop()
})

describe('SSR and hydration', () => {
  test('explicit memory mode supports SSR without the browser API', async () => {
    vi.stubGlobal('navigation', undefined)
    vi.stubGlobal('NavigationPrecommitController', undefined)

    const home = createRoute({ name: 'home', path: '/' }).addLoader(() => 'server value')
    const server = createRouter([home], { ssr: true, historyMode: 'memory', initialUrl: '/' })
    const response = await server.render()

    expect(response.kind).toBe('success')
    await expect(server.route.data).resolves.toBe('server value')

    server.stop()
  })

  test.each(['auto', 'browser'] as const)('SSR does not override %s when its browser API is unavailable', (historyMode) => {
    vi.stubGlobal('navigation', undefined)
    vi.stubGlobal('NavigationPrecommitController', undefined)
    const home = createRoute({ name: 'home', path: '/' })

    expect(() => createRouter([home], { ssr: true, historyMode, initialUrl: '/' })).toThrow('requires the Navigation API')
  })

  test('hydration adopts the server values synchronously without a navigation or before hooks', async () => {
    window.history.replaceState(null, '', '/')
    const native = mockNavigation({ visit: '5' })
    const initialEntry = native.currentEntry
    const load = vi.fn(() => 'client value')
    const before = vi.fn()
    const home = createRoute({ name: 'home', path: '/', state: { visit: Number } }).addLoader(load)
    const router = createRouter([home])

    document.body.innerHTML = payloadToScript({
      kind: 'success',
      url: '/',
      values: [{ kind: 'loader', depth: 0, name: 'default', encoded: JSON.stringify('server value') }],
    })
    document.title = 'server title'
    router.onBeforeRouteEnter(before)

    const ready = router.start()

    expect(router.route.name).toBe('home')
    expect(router.route.state).toEqual({ visit: 5 })
    expect(router.started.value).toBe(true)
    await ready

    await expect(router.route.data).resolves.toBe('server value')
    expect(native.navigate).not.toHaveBeenCalled()
    expect(native.currentEntry).toBe(initialEntry)
    expect(before).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
    expect(document.title).toBe('server title')

    router.stop()
  })

  test('browser mode requires precommit support instead of silently falling back', () => {
    vi.stubGlobal('NavigationPrecommitController', undefined)
    Reflect.deleteProperty(window, 'NavigationPrecommitController')

    expect(() => createTestRouter()).toThrow('requires the Navigation API')
  })
})

test('noncancelable traversals use a document reload instead of attempting precommit guards', async () => {
  const native = mockNavigation()
  const prepare = vi.fn()
  const browser = createBrowserNavigation({ prepare })
  const intercept = vi.fn()
  const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {})
  const event = Object.assign(new Event('navigate'), {
    canIntercept: true,
    downloadRequest: null,
    formData: null,
    intercept,
  })

  browser.startListening()
  native.dispatchEvent(event)

  expect(prepare).not.toHaveBeenCalled()
  expect(intercept).toHaveBeenCalledOnce()

  const options = intercept.mock.calls[0][0] as NavigationInterceptOptions

  expect(options.precommitHandler).toBeUndefined()
  await options.handler?.()
  expect(reload).toHaveBeenCalledOnce()

  browser.stopListening()
  reload.mockRestore()
})
