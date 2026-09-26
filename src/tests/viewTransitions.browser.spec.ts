import { afterEach, beforeAll, expect, MockInstance, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h } from 'vue'
import { register, unregister } from 'view-transitions-mock'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { RouterOptions } from '@/types/router'
import { Routes } from '@/types/route'
import { useLink, useViewTransition } from '@/main'

beforeAll(() => {
  vi.spyOn(console, 'info').mockImplementation(() => {})
  register({ forced: true })
})

afterEach(async () => {
  // a transition one test leaves running collides with the next test's inside the mock
  const active = document.activeViewTransition

  active?.skipTransition()
  await active?.finished

  vi.restoreAllMocks()
})

const routeA = createRoute({ name: 'routeA', path: '/routeA', component })
const routeB = createRoute({ name: 'routeB', path: '/routeB', component })

async function startRouter(options: RouterOptions = {}, routes: Routes = [routeA, routeB]): Promise<ReturnType<typeof createRouter>> {
  const router = createRouter(routes, { initialUrl: '/routeA', ...options })

  await router.start()

  return router
}

function spyOnTransitions(): MockInstance<Document['startViewTransition']> {
  return vi.spyOn(document, 'startViewTransition')
}

function transitionOf(router: ReturnType<typeof createRouter>): ViewTransition {
  if (!router.viewTransition.transition) {
    throw new Error('no transition has started')
  }

  return router.viewTransition.transition
}

test('navigations do not transition unless asked to', async () => {
  const started = spyOnTransitions()
  const router = await startRouter()

  await router.push('routeB')

  expect(started).not.toHaveBeenCalled()
  expect(router.route.name).toBe('routeB')
})

test('the router option transitions every navigation, committing the route inside the callback', async () => {
  const startViewTransition = document.startViewTransition.bind(document)
  const router = await startRouter({ viewTransition: true })
  const routeWhenStarted = vi.fn()

  vi.spyOn(document, 'startViewTransition').mockImplementation((options) => {
    routeWhenStarted(router.route.name)

    return startViewTransition(options)
  })

  await router.push('routeB')

  expect(routeWhenStarted).toHaveBeenCalledWith('routeA')
  expect(router.route.name).toBe('routeB')
})

test('the first navigation does not transition', async () => {
  const started = spyOnTransitions()

  await startRouter({ viewTransition: true })

  expect(started).not.toHaveBeenCalled()
})

test('the server does not transition', async () => {
  const started = spyOnTransitions()
  const router = await startRouter({ viewTransition: true, ssr: true })

  await router.push('routeB')

  expect(started).not.toHaveBeenCalled()
  expect(router.route.name).toBe('routeA')
  expect(await router.render()).toMatchObject({ kind: 'redirect', location: '/routeB' })
})

test('a browser without the api navigates as before', async () => {
  unregister()

  try {
    const router = await startRouter({ viewTransition: true })

    await router.push('routeB')

    expect(router.route.name).toBe('routeB')
  } finally {
    register({ forced: true })
  }
})

test('a navigation to a url no route matches does not transition', async () => {
  const started = spyOnTransitions()
  const router = await startRouter({ viewTransition: true })

  await router.push('/nowhere')

  expect(started).not.toHaveBeenCalled()
})

test('a route option overrides the router option', async () => {
  const started = spyOnTransitions()
  const off = createRoute({ name: 'off', path: '/off', component, viewTransition: false })
  const on = createRoute({ name: 'on', path: '/on', component, viewTransition: true })
  const router = await startRouter({ viewTransition: true }, [routeA, off, on])

  await router.push('off')

  expect(started).not.toHaveBeenCalled()

  await router.push('on')

  expect(started).toHaveBeenCalledOnce()
})

test('a child route inherits its parent route option', async () => {
  const started = spyOnTransitions()
  const parent = createRoute({ name: 'parent', path: '/parent', viewTransition: true })
  const child = createRoute({ parent, name: 'child', path: '/child', component })
  const router = await startRouter({}, [routeA, child])

  await router.push('child')

  expect(started).toHaveBeenCalledOnce()
})

test('a push option overrides the route and router options', async () => {
  const started = spyOnTransitions()
  const router = await startRouter({ viewTransition: true })

  await router.push('routeB', {}, { viewTransition: false })

  expect(started).not.toHaveBeenCalled()

  await router.push('routeA', {}, { viewTransition: true })

  expect(started).toHaveBeenCalledOnce()
})

test('a push option given with a url or a resolved route reaches the transition', async () => {
  const started = spyOnTransitions()
  const router = await startRouter()

  await router.push('/routeB', { viewTransition: true })
  await router.push(router.resolve('routeA'), { viewTransition: true })

  expect(started).toHaveBeenCalledTimes(2)
  expect(router.route.name).toBe('routeA')
})

test('useLink passes the option to the navigation', async () => {
  const started = spyOnTransitions()
  const router = await startRouter()

  const link = defineComponent(() => {
    const { push } = useLink('routeB', {}, { viewTransition: true })

    return () => h('button', { onClick: () => push() })
  })

  const wrapper = mount(link, {
    global: {
      plugins: [router],
    },
  })

  await wrapper.find('button').trigger('click')
  await flushPromises()

  expect(started).toHaveBeenCalledOnce()
})

test('waits for props before the transition starts', async () => {
  const started = spyOnTransitions()
  const props = Promise.withResolvers<{ value: string }>()
  const withProps = createRoute({ name: 'withProps', path: '/withProps' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, withProps])

  const navigation = router.push('withProps')
  await flushPromises()

  expect(started).not.toHaveBeenCalled()

  props.resolve({ value: 'loaded' })
  await navigation

  expect(started).toHaveBeenCalledOnce()
  expect(router.route.name).toBe('withProps')
})

test('waits for loaders before the transition starts', async () => {
  const started = spyOnTransitions()
  const loader = Promise.withResolvers<string>()
  const withLoader = createRoute({ name: 'withLoader', path: '/withLoader', component }).addLoader(() => loader.promise)
  const router = await startRouter({ viewTransition: true }, [routeA, withLoader])

  const navigation = router.push('withLoader')
  await flushPromises()

  expect(started).not.toHaveBeenCalled()

  loader.resolve('loaded')
  await navigation

  expect(started).toHaveBeenCalledOnce()
})

test('waits for async components before the transition starts', async () => {
  const started = spyOnTransitions()
  const chunk = Promise.withResolvers<typeof component>()
  const lazy = createRoute({ name: 'lazy', path: '/lazy', component: defineAsyncComponent(() => chunk.promise) })
  const router = await startRouter({ viewTransition: true }, [routeA, lazy])

  const navigation = router.push('lazy')
  await flushPromises()

  expect(started).not.toHaveBeenCalled()

  chunk.resolve(component)
  await navigation

  expect(started).toHaveBeenCalledOnce()
})

test('a navigation that arrives while another waits on its data supersedes it', async () => {
  const started = spyOnTransitions()
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, routeB, slow])

  const toSlow = router.push('slow')
  const toB = router.push('routeB')

  await toB

  expect(started).toHaveBeenCalledOnce()

  props.resolve({ value: 'late' })
  await toSlow
  await flushPromises()

  expect(started).toHaveBeenCalledOnce()
  expect(router.route.name).toBe('routeB')
})

test('props that reject still commit, and the rejection is handled as it is without a transition', async () => {
  const started = spyOnTransitions()
  const rejecting = createRoute({ name: 'rejecting', path: '/rejecting' }).addView(component, {
    props: (_route, { reject }) => {
      reject('NotFound')

      return {}
    },
  })
  const onRejection = vi.fn()
  const router = await startRouter({ viewTransition: true }, [routeA, rejecting])

  router.onRejection(onRejection)

  await router.push('rejecting')
  await flushPromises()

  expect(started).toHaveBeenCalledOnce()
  expect(onRejection).toHaveBeenCalledOnce()
})

test('the types of every level are given to the transition', async () => {
  const started = spyOnTransitions()
  const typed = createRoute({ name: 'typed', path: '/typed', component, viewTransition: { types: ['page'] } })
  const router = await startRouter({ viewTransition: ['app'] }, [routeA, typed])

  await router.push('typed', {}, { viewTransition: ['slide-left'] })

  expect(started).toHaveBeenCalledWith(expect.objectContaining({ types: ['app', 'page', 'slide-left'] }))
})

test('a types callback is given the navigation and can skip the transition', async () => {
  const started = spyOnTransitions()
  const types = vi.fn(() => false as const)
  const router = await startRouter({ viewTransition: { types } })

  await router.push('routeB')

  expect(started).not.toHaveBeenCalled()
  expect(types).toHaveBeenCalledWith({
    to: expect.objectContaining({ name: 'routeB' }),
    from: expect.objectContaining({ name: 'routeA' }),
  })
})

test('router.viewTransition describes the navigation while its data loads, then carries the transition, then clears', async () => {
  const props = Promise.withResolvers<{ value: string }>()
  const withProps = createRoute({ name: 'withProps', path: '/withProps' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: ['slide'] }, [routeA, withProps])

  expect(router.viewTransition.isTransitioning).toBe(false)

  const navigation = router.push('withProps')
  await flushPromises()

  expect(router.viewTransition).toMatchObject({
    isTransitioning: true,
    types: ['slide'],
    transition: undefined,
  })
  expect(router.viewTransition.to?.name).toBe('withProps')
  expect(router.viewTransition.from?.name).toBe('routeA')

  props.resolve({ value: 'loaded' })
  await navigation

  const transition = transitionOf(router)

  expect(router.viewTransition.isTransitioning).toBe(true)

  await transition.finished
  await flushPromises()

  expect(router.viewTransition.isTransitioning).toBe(false)
  expect(router.viewTransition.to).toBeUndefined()
})

test('a navigation that does not transition clears router.viewTransition', async () => {
  const started = spyOnTransitions()
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, routeB, slow])

  const toSlow = router.push('slow')
  await flushPromises()

  expect(router.viewTransition.to?.name).toBe('slow')

  await router.push('routeB', {}, { viewTransition: false })

  expect(router.viewTransition.isTransitioning).toBe(false)
  expect(started).not.toHaveBeenCalled()

  props.resolve({ value: 'late' })
  await toSlow
})

test('useViewTransition returns the router state', async () => {
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, slow])
  const seen = vi.fn()

  const probe = defineComponent(() => {
    const viewTransition = useViewTransition()

    return () => {
      seen(viewTransition.isTransitioning, viewTransition.to?.name)

      return h('div')
    }
  })

  mount(probe, {
    global: {
      plugins: [router],
    },
  })

  expect(seen).toHaveBeenLastCalledWith(false, undefined)

  const navigation = router.push('slow')
  await flushPromises()

  expect(seen).toHaveBeenLastCalledWith(true, 'slow')

  props.resolve({ value: 'loaded' })
  await navigation
})

test('a link knows when a transition to its location is in flight', async () => {
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, routeB, slow])

  const links = defineComponent(() => {
    const toSlow = useLink('slow')
    const toB = useLink('routeB')

    return () => h('div', [
      h('span', { id: 'slow' }, String(toSlow.isTransitioning.value)),
      h('span', { id: 'b' }, String(toB.isTransitioning.value)),
    ])
  })

  const wrapper = mount(links, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.find('#slow').text()).toBe('false')

  const navigation = router.push('slow')
  await flushPromises()

  expect(wrapper.find('#slow').text()).toBe('true')
  expect(wrapper.find('#b').text()).toBe('false')

  props.resolve({ value: 'loaded' })
  await navigation
  await transitionOf(router).finished
  await flushPromises()

  expect(wrapper.find('#slow').text()).toBe('false')
})

test('router-link exposes isTransitioning to its slot', async () => {
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, slow])

  const wrapper = mount({
    template: `
      <RouterLink :to="(resolve) => resolve('slow')" v-slot="{ isTransitioning }">
        <span id="state">{{ isTransitioning }}</span>
      </RouterLink>
    `,
  }, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.find('#state').text()).toBe('false')

  const navigation = router.push('slow')
  await flushPromises()

  expect(wrapper.find('#state').text()).toBe('true')

  props.resolve({ value: 'loaded' })
  await navigation
})
