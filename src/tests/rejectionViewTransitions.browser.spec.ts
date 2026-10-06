import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeAll, expect, test, vi } from 'vitest'
import { Component, defineAsyncComponent, h } from 'vue'
import { register } from 'view-transitions-mock'
import { isResolvedRoute, RouterView, useViewTransition } from '@/main'
import { createRejection } from '@/services/createRejection'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { RouterViewTransition, ViewTransitionConfig } from '@/types/viewTransition'
import { payloadToScript } from '@/services/payload'

type RejectionSource = 'before' | 'after' | 'props' | 'loader' | 'unmatched' | 'direct'

const wrappers: ReturnType<typeof mount>[] = []

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  register({ forced: true })
})

afterEach(async () => {
  const transition = document.activeViewTransition
  transition?.skipTransition()
  await transition?.finished
  vi.restoreAllMocks()
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  document.body.innerHTML = ''
})

async function setup({ source, viewTransition = true, rejectionComponent }: {
  source?: RejectionSource,
  viewTransition?: ViewTransitionConfig,
  rejectionComponent?: Component,
} = {}): Promise<{
  router: ReturnType<typeof createRouter>,
  wrapper: ReturnType<typeof mount>,
  state: RouterViewTransition,
}> {
  const home = createRoute({ name: 'home', path: '/', component: { template: '<div>home</div>' } })
  const denied = createRejection({
    type: 'Denied',
    status: 403,
    component: rejectionComponent ?? { template: '<div>denied</div>' },
  })
  const next = createRoute({ name: 'next', path: '/next', context: [denied] })
    .addView({ template: '<div>next</div>' }, {
      props: (_route, { reject }) => {
        if (source === 'props') {
          reject('Denied')
        }

        return {}
      },
    })
    .addLoader((_route, { reject }) => {
      if (source === 'loader') {
        reject('Denied')
      }

      return 'ready'
    })
  if (source === 'before') {
    next.onBeforeRouteEnter((_route, { reject }) => reject('Denied'))
  }

  if (source === 'after') {
    next.onAfterRouteEnter((_route, { reject }) => reject('Denied'))
  }

  const router = createRouter([home, next], {
    initialUrl: '/',
    historyMode: 'memory',
    viewTransition,
    rejections: [
      denied,
      createRejection({ type: 'NotFound', status: 404, component: { template: '<div>not found</div>' } }),
    ],
  })
  let state: RouterViewTransition | undefined
  const wrapper = mount({
    setup() {
      state = useViewTransition()
      return () => h(RouterView)
    },
  }, { global: { plugins: [router] } })
  wrappers.push(wrapper)
  await router.start()
  await flushPromises()

  if (!state) {
    throw new Error('transition state was not provided')
  }

  return { router, wrapper, state }
}

function activeTransition(state: RouterViewTransition): ViewTransition {
  if (!state.transition) {
    throw new Error('no transition has started')
  }
  return state.transition
}

test.each(['before', 'props', 'loader', 'unmatched', 'direct'] as const)('%s rejection is rendered inside a single transition', async (source) => {
  const { router, wrapper, state } = await setup({ source })
  const outgoing = vi.fn()
  const incoming = vi.fn()
  const start = document.startViewTransition.bind(document)
  const started = vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    outgoing(wrapper.text())
    const transition = start(options)
    transition.updateCallbackDone.then(() => incoming(wrapper.text(), state.to, state.from))

    return transition
  })

  if (source === 'direct') {
    router.reject('Denied')
  } else {
    await router.push(source === 'unmatched' ? '/missing' : '/next')
  }
  await flushPromises()

  expect(started).toHaveBeenCalledOnce()
  expect(outgoing).toHaveBeenCalledWith('home')
  expect(wrapper.text()).toBe(source === 'unmatched' ? 'not found' : 'denied')
  expect(incoming).toHaveBeenCalledWith(
    source === 'unmatched' ? 'not found' : 'denied',
    expect.objectContaining({ type: source === 'unmatched' ? 'NotFound' : 'Denied' }),
    expect.objectContaining({ name: 'home' }),
  )
})

test('leaving a rejection reports the rejection as the outgoing page', async () => {
  const { router, wrapper, state } = await setup()
  router.reject('Denied')
  await flushPromises()
  await activeTransition(state).finished

  const started = vi.spyOn(document, 'startViewTransition')
  await router.push('next')
  await activeTransition(state).updateCallbackDone

  expect(started).toHaveBeenCalledOnce()
  expect(state.from).toMatchObject({ type: 'Denied' })
  expect(state.to).toMatchObject({ name: 'next' })
  expect(wrapper.text()).toBe('next')
})

test('transitions between two rejection views', async () => {
  const { router, wrapper, state } = await setup()
  router.reject('Denied')
  await flushPromises()
  await activeTransition(state).finished

  const started = vi.spyOn(document, 'startViewTransition')
  router.reject('NotFound')
  await flushPromises()
  await activeTransition(state).updateCallbackDone

  expect(started).toHaveBeenCalledOnce()
  expect(state.from).toMatchObject({ type: 'Denied' })
  expect(state.to).toMatchObject({ type: 'NotFound' })
  expect(wrapper.text()).toBe('not found')
})

test.each(['before', 'props', 'loader', 'direct'] as const)('%s rejection waits for its lazy view before the destination capture', async (source) => {
  const imported = Promise.withResolvers<Component>()
  const { router, wrapper } = await setup({
    source,
    rejectionComponent: defineAsyncComponent(() => imported.promise),
  })
  const incoming = vi.fn()
  const start = document.startViewTransition.bind(document)
  vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    const transition = start(options)
    transition.updateCallbackDone.then(() => incoming(wrapper.text()))

    return transition
  })

  const navigation = source === 'direct' ? router.reject('Denied') : router.push('next')
  await flushPromises()
  expect(incoming).not.toHaveBeenCalled()

  imported.resolve({ template: '<div>denied</div>' })
  await navigation
  await flushPromises()
  expect(incoming).toHaveBeenCalledWith('denied')
})

test.each(['before', 'props', 'loader'] as const)('%s rejection supplies the actual destination to the types callback', async (source) => {
  const types = vi.fn(({ to }) => {
    return isResolvedRoute(to) ? ['route'] : ['rejection']
  })
  const { router, state } = await setup({ source, viewTransition: { types } })
  const capturedTypes = vi.fn()
  const start = document.startViewTransition.bind(document)
  vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    const transition = start(options)
    transition.updateCallbackDone.then(() => capturedTypes(state.types, [...transition.types]))

    return transition
  })

  await router.push('next')
  await flushPromises()

  expect(types).toHaveBeenLastCalledWith(expect.objectContaining({
    to: expect.objectContaining({ type: 'Denied' }),
    from: expect.objectContaining({ name: 'home' }),
  }))
  expect(capturedTypes).toHaveBeenCalledWith(['rejection'], ['rejection'])
})

test('an after hook transitions from the entered route to its rejection', async () => {
  const { router, wrapper, state } = await setup({ source: 'after' })
  const incoming = vi.fn()
  const start = document.startViewTransition.bind(document)
  const started = vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    const transition = start(options)
    transition.updateCallbackDone.then(() => incoming(state.to, state.from))

    return transition
  })

  await router.push('next')
  await flushPromises()

  expect(started).toHaveBeenCalledTimes(2)
  expect(incoming).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: 'Denied' }),
    expect.objectContaining({ name: 'next' }),
  )
  expect(wrapper.text()).toBe('denied')
})

test('a navigation can disable a before-hook rejection transition', async () => {
  const { router, wrapper } = await setup({ source: 'before' })
  const started = vi.spyOn(document, 'startViewTransition')

  await router.push('next', {}, { viewTransition: false })
  await flushPromises()

  expect(started).not.toHaveBeenCalled()
  expect(wrapper.text()).toBe('denied')
})

test.each(['props', 'loader'] as const)('%s rejection can disable the animation through its types callback', async (source) => {
  const { router, wrapper } = await setup({
    source,
    viewTransition: {
      types: ({ to }) => {
        return isResolvedRoute(to) ? [] : false
      },
    },
  })
  const skipped = vi.fn()
  const start = document.startViewTransition.bind(document)
  vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    const transition = start(options)
    const skip = transition.skipTransition.bind(transition)
    vi.spyOn(transition, 'skipTransition').mockImplementation(() => {
      skipped()
      skip()
    })

    return transition
  })

  await router.push('next')
  await flushPromises()

  expect(skipped).toHaveBeenCalledOnce()
  expect(wrapper.text()).toBe('denied')
})

test('a disabled router preserves synchronous direct rejection', async () => {
  const { router, wrapper } = await setup({ viewTransition: false })
  const onRejection = vi.fn()
  router.onRejection(onRejection)
  const started = vi.spyOn(document, 'startViewTransition')

  router.reject('Denied')

  expect(onRejection).toHaveBeenCalledOnce()
  expect(started).not.toHaveBeenCalled()
  await flushPromises()
  expect(wrapper.text()).toBe('denied')
})

test('superseding a lazy rejection prevents its transition and DOM update', async () => {
  const component = Promise.withResolvers<{ template: string }>()
  const load = vi.fn(() => component.promise)
  const home = createRoute({ name: 'home', path: '/', component: { template: '<div>home</div>' } })
  const next = createRoute({ name: 'next', path: '/next', component: { template: '<div>next</div>' } })
  const router = createRouter([home, next], {
    initialUrl: '/',
    historyMode: 'memory',
    viewTransition: true,
    rejections: [createRejection({ type: 'Denied', component: defineAsyncComponent(load) })],
  })
  const wrapper = mount({ template: '<RouterView />' }, { global: { plugins: [router] } })
  wrappers.push(wrapper)
  await router.start()
  const started = vi.spyOn(document, 'startViewTransition')

  router.reject('Denied')
  await flushPromises()
  expect(load).toHaveBeenCalledOnce()
  expect(wrapper.text()).toBe('home')

  await router.push('next', {}, { viewTransition: false })
  component.resolve({ template: '<div>denied</div>' })
  await flushPromises()

  expect(started).not.toHaveBeenCalled()
  expect(wrapper.text()).toBe('next')
})

test('server rejections keep their status without starting a browser transition', async () => {
  const denied = createRejection({ type: 'Denied', status: 403 })
  const home = createRoute({ name: 'home', path: '/', context: [denied] })
  home.onBeforeRouteEnter((_route, { reject }) => reject('Denied'))
  const router = createRouter([home], { initialUrl: '/', historyMode: 'memory', ssr: true, viewTransition: true })
  const started = vi.spyOn(document, 'startViewTransition')

  expect(await router.render()).toMatchObject({ kind: 'reject', status: 403 })
  expect(started).not.toHaveBeenCalled()
})

test('hydration adopts a rejection without starting a transition', async () => {
  document.body.innerHTML = payloadToScript({ kind: 'reject', url: '/', rejection: 'Denied' })
  const started = vi.spyOn(document, 'startViewTransition')

  const { wrapper, state } = await setup()

  expect(started).not.toHaveBeenCalled()
  expect(state.isTransitioning).toBe(false)
  expect(wrapper.text()).toBe('denied')
})
