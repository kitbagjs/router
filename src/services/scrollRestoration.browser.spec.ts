/* eslint-disable vue/one-component-per-file */
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { defineAsyncComponent, defineComponent, h, onMounted, Suspense } from 'vue'
import { createRoute, createRouter, RouterView } from '@/main'
import { Router } from '@/types/router'
import { createScrollRestoration } from '@/services/createScrollRestoration'

const LIST = '/list/one'
const DETAIL = '/detail'
const FAILED = new Error('Failed destination')
let router: Router | undefined
let wrapper: VueWrapper | undefined
let navigation: EventTarget

beforeEach(() => {
  navigation = new EventTarget()
  vi.stubGlobal('navigation', navigation)
  window.history.scrollRestoration = 'auto'
})

afterEach(() => {
  wrapper?.unmount()
  router?.stop()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function nativeEvent(options: Partial<NavigateEvent> = {}): { event: NavigateEvent, finished: () => Promise<void> | undefined } {
  let handler: NavigationInterceptOptions['handler']
  const event = Object.assign(new Event('navigate', { cancelable: options.cancelable ?? true }), {
    canIntercept: true,
    destination: { sameDocument: true },
    navigationType: 'traverse',
    signal: new AbortController().signal,
    scroll: vi.fn(),
    intercept: vi.fn((options: NavigationInterceptOptions) => handler = options.handler),
    ...Object.fromEntries(Object.entries(options).filter(([key]) => !['defaultPrevented', 'cancelable'].includes(key))),
  }) as unknown as NavigateEvent

  if (options.defaultPrevented) event.preventDefault()
  navigation.dispatchEvent(event)
  return {
    event,
    finished: () => {
      return handler ? Promise.resolve(handler()) : undefined
    },
  }
}

function traverse(url = LIST): Promise<void> {
  const { finished } = nativeEvent()
  window.history.replaceState({ key: 'selected', idx: 0 }, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
  return finished() ?? Promise.reject(new Error('Traversal not intercepted'))
}

test.each([
  { enabled: false },
  { enabled: true, mode: 'memory' as const },
  { enabled: true, mode: 'hash' as const },
])('does not listen with %j', (options) => {
  const restoration = createScrollRestoration(options)
  restoration.start()
  expect(nativeEvent().event.intercept).not.toHaveBeenCalled()
  restoration.stop()
})

test('unsupported browsers and manual restoration are left alone', () => {
  vi.stubGlobal('navigation', undefined)
  // Older browsers omit the property entirely.
  Reflect.deleteProperty(window, 'navigation')
  const restoration = createScrollRestoration({ enabled: true })
  restoration.start()
  vi.stubGlobal('navigation', navigation)
  restoration.start()
  window.history.scrollRestoration = 'manual'
  expect(nativeEvent().event.intercept).not.toHaveBeenCalled()
  restoration.stop()
  expect(window.history.scrollRestoration).toBe('manual')
})

test('only one router owns interception; stop releases ownership', async () => {
  const first = createScrollRestoration({ enabled: true })
  const second = createScrollRestoration({ enabled: true })
  first.start()
  second.start()
  const { event, finished } = nativeEvent()
  expect(event.intercept).toHaveBeenCalledOnce()
  const result = expect(finished()).rejects.toThrow('Router stopped')
  first.stop()
  await result
  second.start()
  expect(nativeEvent().event.intercept).toHaveBeenCalledOnce()
  second.stop()
})

test.each([
  { navigationType: 'push' as const },
  { navigationType: 'replace' as const },
  { navigationType: 'reload' as const },
  { canIntercept: false },
  { scroll: undefined },
  { intercept: undefined },
  { hashChange: true },
  { destination: { sameDocument: false } as NavigationDestination },
  { defaultPrevented: true },
])('ignores ineligible event %j', (options) => {
  const restoration = createScrollRestoration({ enabled: true })
  restoration.start()
  const { finished } = nativeEvent(options)
  expect(finished()).toBeUndefined()
  restoration.stop()
})

async function install(component = defineComponent({ props: { id: { type: String, required: true } }, template: '<div>{{ id }}</div>' }), suspense = false): Promise<{ resolve: () => void, props: () => void, loader: () => void }> {
  const pending = Promise.withResolvers<undefined>()
  const loader = Promise.withResolvers<string>()
  let visiting = false
  const list = createRoute({ name: 'list', path: '/list/[id]', component }, async (route) => {
    if (visiting) await pending.promise
    return { id: route.params.id }
  }).addLoader(() => {
    return visiting ? loader.promise : 'initial'
  })
  const detail = createRoute({ name: 'detail', path: DETAIL, component: { template: 'detail' } })
  router = createRouter([list, detail], { initialUrl: LIST, scrollRestoration: true })
  wrapper = mount({
    render: () => {
      return suspense ? h(Suspense, null, { default: () => h(RouterView) }) : h(RouterView)
    },
  }, { global: { plugins: [router] } })
  await router.start()
  await flushPromises()
  await router.push(DETAIL)
  visiting = true
  return {
    resolve: () => {
      pending.resolve(undefined)
      loader.resolve('loaded')
    },
    props: () => pending.resolve(undefined),
    loader: () => loader.resolve('loaded'),
  }
}

test.each([false, true])('adopts POP and waits for props and independent loaders (Suspense: %s)', async (suspense) => {
  const pending = await install(undefined, suspense)
  const replace = vi.spyOn(window.history, 'replaceState')
  const finished = traverse()
  replace.mockClear()
  const done = vi.fn()
  void finished.then(done)
  await flushPromises()
  expect(done).not.toHaveBeenCalled()
  pending.props()
  await flushPromises()
  expect(done).not.toHaveBeenCalled()
  expect(wrapper?.text()).toBe('detail')
  pending.loader()
  await finished
  expect(wrapper?.text()).toBe('one')
  expect(replace).not.toHaveBeenCalled()
  expect(window.history.state.key).toBe('selected')
})

test('waits for lazy component DOM and preserves reuse on a later parameter change', async () => {
  const loaded = Promise.withResolvers<any>()
  let mounts = 0
  const component = defineAsyncComponent(() => loaded.promise)
  const pending = await install(component)
  const finished = traverse()
  pending.resolve()
  await flushPromises()
  const done = vi.fn()
  void finished.then(done)
  await flushPromises()
  expect(done).not.toHaveBeenCalled()
  loaded.resolve(defineComponent({
    props: { id: { type: String, required: true } },
    setup: (props) => {
      onMounted(() => mounts++)
      return () => h('div', props.id)
    },
  }))
  await finished
  expect(wrapper?.text()).toBe('one')
  const mounted = mounts
  await traverse('/list/two')
  expect(wrapper?.text()).toBe('two')
  expect(mounts).toBe(mounted)
})

test.each(['abort', 'error', 'reject', 'redirect'] as const)('settles guard %s without restoring', async (outcome) => {
  await install()
  router?.onError(() => {
    throw new Error('Unhandled hook error')
  })
  router?.onBeforeRouteEnter((_to, context) => {
    if (outcome === 'abort') throw context.abort()
    if (outcome === 'error') throw FAILED
    if (outcome === 'reject') throw context.reject('NotFound')
    throw context.push(DETAIL)
  })
  await expect(traverse()).rejects.toBeDefined()
  await flushPromises()
  expect(wrapper?.text()).toBe(outcome === 'reject' ? 'NotFound' : 'detail')
})

test.each(['stop', 'supersede'] as const)('settles %s while props are pending and ignores their late completion', async (outcome) => {
  const pending = await install()
  const finished = traverse()
  const rejected = expect(finished).rejects.toBeDefined()
  await flushPromises()
  if (outcome === 'stop') router?.stop()
  else await router?.push(DETAIL)
  await rejected
  pending.resolve()
  await flushPromises()
  if (outcome === 'supersede') expect(wrapper?.text()).toBe('detail')
})

test('browser cancellation aborts a guard and ignores its late result', async () => {
  await install()
  const guard = Promise.withResolvers<undefined>()
  router?.onBeforeRouteEnter(() => guard.promise)
  const controller = new AbortController()
  const { finished } = nativeEvent({ signal: controller.signal })
  window.history.replaceState({}, '', LIST)
  window.dispatchEvent(new PopStateEvent('popstate'))
  const result = expect(finished()).rejects.toBeDefined()
  controller.abort()
  await result
  guard.resolve(undefined)
  await flushPromises()
  expect(wrapper?.text()).toBe('detail')
})

test.each(['reject', 'redirect'] as const)('after hook %s abandons restoration', async (outcome) => {
  const pending = await install()
  router?.onAfterRouteEnter((to, context) => {
    if (to.name !== 'list') return
    if (outcome === 'reject') throw context.reject('NotFound')
    throw context.push(DETAIL)
  })
  const traversal = traverse()
  const failed = expect(traversal).rejects.toBeDefined()
  pending.resolve()
  await failed
  await flushPromises()
  expect(wrapper?.text()).toBe(outcome === 'reject' ? 'NotFound' : 'detail')
})

test('noncancelable traversals can still be intercepted', () => {
  const restoration = createScrollRestoration({ enabled: true })
  restoration.start()
  const event = nativeEvent({ cancelable: false })
  expect(event.event.cancelable).toBe(false)
  // The router does not call preventDefault or rely on cancelability for interception.
  expect(event.event.intercept).toHaveBeenCalledOnce()
  restoration.stop()
})

test('a failed lazy component rejects restoration and retains Vue error handling', async () => {
  const loaded = Promise.withResolvers<any>()
  const list = createRoute({ name: 'list', path: LIST, component: defineAsyncComponent(() => loaded.promise) })
  const detail = createRoute({ name: 'detail', path: DETAIL, component: { template: 'detail' } })
  router = createRouter([list, detail], { initialUrl: DETAIL, scrollRestoration: true })
  const onError = vi.fn()
  wrapper = mount(RouterView, { global: { plugins: [router], config: { errorHandler: onError } } })
  await router.start()
  await flushPromises()
  const failed = expect(traverse()).rejects.toBeDefined()
  await flushPromises()
  loaded.reject(FAILED)
  await failed
  await flushPromises()
  expect(onError).toHaveBeenCalledWith(FAILED, expect.anything(), 'async component loader')
  expect(router.route.name).toBe('list')
})

test('native scroll runs once after destination DOM flush', async () => {
  const pending = await install()
  const { event, finished } = nativeEvent()
  window.history.replaceState({}, '', LIST)
  window.dispatchEvent(new PopStateEvent('popstate'))
  vi.mocked(event.scroll).mockImplementation(() => {
    expect(wrapper?.text()).toBe('one')
  })
  pending.resolve()
  await finished()
  expect(event.scroll).toHaveBeenCalledOnce()
})

test.each([{ ssr: true }, { isGlobalRouter: false }])('does not intercept for %j', async (options) => {
  router = createRouter([createRoute({ path: DETAIL, component: { template: 'detail' } })], { initialUrl: DETAIL, scrollRestoration: true, ...options })
  await router.start()
  expect(nativeEvent().event.intercept).not.toHaveBeenCalled()
})
