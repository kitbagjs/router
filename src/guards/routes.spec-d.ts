import { expectTypeOf, test } from 'vitest'
import { createIsRoute } from '@/guards/routes'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'
import { InjectionKey } from 'vue'

test('router route can be narrowed', () => {
  const parentA = createRoute({
    name: 'parentA',
    path: '/parentA',
  })

  const childA = createRoute({
    parent: parentA,
    name: 'childA',
    path: '[?foo]',
    query: withParams('bar=[?bar]', { bar: Boolean }),
    component,
  })

  const routes = [
    parentA,
    childA,
    createRoute({
      name: 'parentB',
      path: '/parentB',
      component,
    }),
  ] as const

  const router = createRouter(routes)

  expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentA' | 'parentB' | 'childA'>()
  const key: InjectionKey<typeof router> = Symbol()

  const isRoute = createIsRoute(key)

  if (router.route.name === 'parentA') {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(router.route, 'parentA', { exact: true })) {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(router.route, 'parentB', { exact: true })) {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentB'>()
  }

  if (isRoute(router.route, 'parentA', { exact: false })) {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentA' | 'childA'>()
  }

  if (isRoute(router.route, 'parentB', { exact: false })) {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentB'>()
  }

  if (isRoute(router.route, 'parentA')) {
    expectTypeOf<typeof router.route.name>().toMatchTypeOf<'parentA' | 'childA'>()
  }

  if (router.route.name === 'parentA') {
    expectTypeOf<typeof router.route.params>().toMatchTypeOf<{}>()
  }

  if (isRoute(router.route, 'parentA', { exact: true })) {
    expectTypeOf<typeof router.route.params>().toMatchTypeOf<{}>()
  }

  if (isRoute(router.route, 'parentA', { exact: false })) {
    expectTypeOf<typeof router.route.params>().toMatchTypeOf<{
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }

  if (isRoute(router.route, 'parentA')) {
    expectTypeOf<typeof router.route.params>().toMatchTypeOf<{
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }
})
