import { afterEach, expect, test, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineAsyncComponent, defineComponent, h } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component, stubViewTransitions } from '@/utilities/testHelpers'
import { RouterOptions } from '@/types/router'
import { Routes } from '@/types/route'
import { useLink, useViewTransition } from '@/main'

let restore = (): void => {}
let current: ReturnType<typeof stubViewTransitions> | undefined

afterEach(() => {
  restore()
})

function stub(options: { types?: boolean } = {}): ReturnType<typeof stubViewTransitions> {
  current = stubViewTransitions(options)
  restore = current.restore

  return current
}

function stubbed(): ReturnType<typeof stubViewTransitions> {
  if (!current) {
    throw new Error('stub() has not been called')
  }

  return current
}

const routeA = createRoute({ name: 'routeA', path: '/routeA', component })
const routeB = createRoute({ name: 'routeB', path: '/routeB', component })

async function startRouter(options: RouterOptions = {}, routes: Routes = [routeA, routeB]): Promise<ReturnType<typeof createRouter>> {
  const router = createRouter(routes, { initialUrl: '/routeA', ...options })

  await router.start()

  return router
}

test('navigations do not transition unless asked to', async () => {
  const { transitions } = stub()
  const router = await startRouter()

  await router.push('routeB')

  expect(transitions).toHaveLength(0)
  expect(router.route.name).toBe('routeB')
})

test('the router option transitions every navigation, committing the route inside the callback', async () => {
  const { transitions } = stub()
  const router = await startRouter({ viewTransition: true })

  const navigation = router.push('routeB')
  await flushPromises()

  expect(transitions).toHaveLength(1)
  expect(router.route.name).toBe('routeA')

  await transitions[0].run()
  await navigation

  expect(router.route.name).toBe('routeB')
})

test('the first navigation does not transition', async () => {
  const { transitions } = stub()

  await startRouter({ viewTransition: true })

  expect(transitions).toHaveLength(0)
})

test('the server does not transition', async () => {
  const { transitions } = stub()
  const router = await startRouter({ viewTransition: true, ssr: true })

  await router.push('routeB')

  expect(transitions).toHaveLength(0)
  expect(router.route.name).toBe('routeB')
})

test('a browser without the api navigates as before', async () => {
  const router = await startRouter({ viewTransition: true })

  await router.push('routeB')

  expect(router.route.name).toBe('routeB')
})

test('a navigation to a url no route matches does not transition', async () => {
  const { transitions } = stub()
  const router = await startRouter({ viewTransition: true })

  await router.push('/nowhere')

  expect(transitions).toHaveLength(0)
})

test('a route option overrides the router option', async () => {
  const { transitions } = stub()
  const off = createRoute({ name: 'off', path: '/off', component, viewTransition: false })
  const on = createRoute({ name: 'on', path: '/on', component, viewTransition: true })
  const router = await startRouter({ viewTransition: true }, [routeA, off, on])

  await router.push('off')

  expect(transitions).toHaveLength(0)

  const navigation = router.push('on')
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
})

test('a child route inherits its parent route option', async () => {
  const { transitions } = stub()
  const parent = createRoute({ name: 'parent', path: '/parent', viewTransition: true })
  const child = createRoute({ parent, name: 'child', path: '/child', component })
  const router = await startRouter({}, [routeA, child])

  const navigation = router.push('child')
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
})

test('a push option overrides the route and router options', async () => {
  const { transitions } = stub()
  const router = await startRouter({ viewTransition: true })

  await router.push('routeB', {}, { viewTransition: false })

  expect(transitions).toHaveLength(0)

  const navigation = router.push('routeA', {}, { viewTransition: true })
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
})

test('a push option given with a url or a resolved route reaches the transition', async () => {
  const { transitions } = stub()
  const router = await startRouter()

  const toB = router.push('/routeB', { viewTransition: true })
  await flushPromises()
  await transitions[0].run()
  await toB

  const toA = router.push(router.resolve('routeA'), { viewTransition: true })
  await flushPromises()
  await transitions[1].run()
  await toA

  expect(transitions).toHaveLength(2)
  expect(router.route.name).toBe('routeA')
})

test('useLink passes the option to the navigation', async () => {
  const { transitions } = stub()
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

  expect(transitions).toHaveLength(1)
})

test('waits for props before the transition starts', async () => {
  const { transitions } = stub()
  const props = Promise.withResolvers<{ value: string }>()
  const withProps = createRoute({ name: 'withProps', path: '/withProps' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, withProps])

  const navigation = router.push('withProps')
  await flushPromises()

  expect(transitions).toHaveLength(0)

  props.resolve({ value: 'loaded' })
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation

  expect(router.route.name).toBe('withProps')
})

test('waits for loaders before the transition starts', async () => {
  const { transitions } = stub()
  const loader = Promise.withResolvers<string>()
  const withLoader = createRoute({ name: 'withLoader', path: '/withLoader', component }).addLoader(() => loader.promise)
  const router = await startRouter({ viewTransition: true }, [routeA, withLoader])

  const navigation = router.push('withLoader')
  await flushPromises()

  expect(transitions).toHaveLength(0)

  loader.resolve('loaded')
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
})

test('waits for async components before the transition starts', async () => {
  const { transitions } = stub()
  const chunk = Promise.withResolvers<typeof component>()
  const lazy = createRoute({ name: 'lazy', path: '/lazy', component: defineAsyncComponent(() => chunk.promise) })
  const router = await startRouter({ viewTransition: true }, [routeA, lazy])

  const navigation = router.push('lazy')
  await flushPromises()

  expect(transitions).toHaveLength(0)

  chunk.resolve(component)
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
})

test('a navigation that arrives while another waits on its data supersedes it', async () => {
  const { transitions } = stub()
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, routeB, slow])

  const toSlow = router.push('slow')
  const toB = router.push('routeB')
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await toB

  props.resolve({ value: 'late' })
  await toSlow
  await flushPromises()

  expect(transitions).toHaveLength(1)
  expect(router.route.name).toBe('routeB')
})

test('props that reject still commit, and the rejection is handled as it is without a transition', async () => {
  const { transitions } = stub()
  const rejecting = createRoute({ name: 'rejecting', path: '/rejecting' }).addView(component, {
    props: (_route, { reject }) => {
      reject('NotFound')

      return {}
    },
  })
  const onRejection = vi.fn()
  const router = await startRouter({ viewTransition: true }, [routeA, rejecting])

  router.onRejection(onRejection)

  const navigation = router.push('rejecting')
  await flushPromises()

  expect(transitions).toHaveLength(1)

  await transitions[0].run()
  await navigation
  await flushPromises()

  expect(onRejection).toHaveBeenCalledOnce()
})

test('the types of every level are given to the transition', async () => {
  const { transitions } = stub()
  const typed = createRoute({ name: 'typed', path: '/typed', component, viewTransition: { types: ['page'] } })
  const router = await startRouter({ viewTransition: ['app'] }, [routeA, typed])

  const navigation = router.push('typed', {}, { viewTransition: ['slide-left'] })
  await flushPromises()

  expect(transitions[0].types).toEqual(['app', 'page', 'slide-left'])

  await transitions[0].run()
  await navigation
})

test('a types callback is given the navigation and can skip the transition', async () => {
  const { transitions } = stub()
  const types = vi.fn(() => false as const)
  const router = await startRouter({ viewTransition: { types } })

  await router.push('routeB')

  expect(transitions).toHaveLength(0)
  expect(types).toHaveBeenCalledWith({
    to: expect.objectContaining({ name: 'routeB' }),
    from: expect.objectContaining({ name: 'routeA' }),
  })
})

test('router.viewTransition describes the navigation while its data loads, then carries the transition, then clears', async () => {
  const { transitions } = stub()
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
  await flushPromises()

  expect(router.viewTransition.transition).toMatchObject({ ready: expect.any(Promise) })

  await transitions[0].run()
  await navigation
  await flushPromises()

  expect(router.viewTransition.isTransitioning).toBe(false)
  expect(router.viewTransition.to).toBeUndefined()
})

test('a navigation that does not transition clears router.viewTransition', async () => {
  const { transitions } = stub()
  const props = Promise.withResolvers<{ value: string }>()
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component, { props: () => props.promise })
  const router = await startRouter({ viewTransition: true }, [routeA, routeB, slow])

  const toSlow = router.push('slow')
  await flushPromises()

  expect(router.viewTransition.to?.name).toBe('slow')

  await router.push('routeB', {}, { viewTransition: false })

  expect(router.viewTransition.isTransitioning).toBe(false)
  expect(transitions).toHaveLength(0)

  props.resolve({ value: 'late' })
  await toSlow
})

test('useViewTransition returns the router state', async () => {
  stub()
  const router = await startRouter({ viewTransition: true })
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

  const navigation = router.push('routeB')
  await flushPromises()

  expect(seen).toHaveBeenLastCalledWith(true, 'routeB')

  await stubbed().transitions[0].run()
  await navigation
})

test('a link knows when a transition to its location is in flight', async () => {
  const { transitions } = stub()
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
  await flushPromises()
  await transitions[0].run()
  await navigation
  await flushPromises()

  expect(wrapper.find('#slow').text()).toBe('false')
})

test('router-link exposes isTransitioning to its slot', async () => {
  const { transitions } = stub()
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
  await flushPromises()
  await transitions[0].run()
  await navigation
})
