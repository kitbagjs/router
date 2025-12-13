import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { UseRouteInvalidError } from '@/errors/useRouteInvalidError'
import { createRouter } from '@/services/createRouter'
import { getError, routes } from '@/utilities/testHelpers'
import { createRouterAssets } from '@/services/createRouterAssets'

test('when given no routeKey returns the router route', async () => {
  const router = createRouter(routes, {
    initialUrl: '/routeA',
  })

  const { useRoute } = createRouterAssets(router)

  await router.start()

  const component = {
    template: 'foo',
    setup() {
      const route = useRoute()

      return { route }
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.route).toBe(router.route)
})

test('when given a routeKey that matches the current route returns the router route', async () => {
  const router = createRouter(routes, {
    initialUrl: '/parentB',
  })

  const { useRoute } = createRouterAssets(router)

  await router.start()

  const component = {
    template: 'foo',
    setup() {
      const route = useRoute('parentB')

      return { route }
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.route).toBe(router.route)
})

test('when given a routeKey that matches exactly the current route returns the router route', async () => {
  const router = createRouter(routes, {
    initialUrl: '/parentA/parentAParam/childA/childAParam',
  })

  const { useRoute } = createRouterAssets(router)

  await router.start()

  const component = {
    template: 'foo',
    setup() {
      const route = useRoute('parentA.childA')

      return { route }
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.route).toBe(router.route)
})

test('when given a routeKey that does not match the current route, throws UseRouteInvalidError', async () => {
  const router = createRouter(routes, {
    initialUrl: '/parentB',
  })

  const { useRoute } = createRouterAssets(router)

  await router.start()

  const component = {
    template: 'foo',
    setup() {
      const route = useRoute('parentC')

      return { route }
    },
  }

  const error = getError(() => {
    mount(component, {
      global: {
        plugins: [router],
      },
    })
  })

  expect(error).toBeInstanceOf(UseRouteInvalidError)
})

test('when given a routeKey that does not match exactly the current route, throws UseRouteInvalidError', async () => {
  const router = createRouter(routes, {
    initialUrl: '/parentA/parentAParam/childA/childAParam',
  })

  const { useRoute } = createRouterAssets(router)

  await router.start()

  const component = {
    template: 'foo',
    setup() {
      const route = useRoute('parentA', { exact: true })

      return { route }
    },
  }

  const error = getError(() => {
    mount(component, {
      global: {
        plugins: [router],
      },
    })
  })

  expect(error).toBeInstanceOf(UseRouteInvalidError)
})
