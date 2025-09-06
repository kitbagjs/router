import { expectTypeOf, test } from 'vitest'
import { createIsRoute } from '@/guards/routes'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'

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

  const { route, key } = createRouter(routes)
  const isRoute = createIsRoute(key)

  expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'parentB' | 'childA'>()

  if (route.name === 'parentA') {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentA', { exact: true })) {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentB', { exact: true })) {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentB'>()
  }

  if (isRoute(route, 'parentA', { exact: false })) {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'childA'>()
  }

  if (isRoute(route, 'parentB', { exact: false })) {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentB'>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'childA'>()
  }

  if (route.name === 'parentA') {
    expectTypeOf<typeof route.params>().toEqualTypeOf<{}>()
  }

  if (isRoute(route, 'parentA', { exact: true })) {
    expectTypeOf<typeof route.params>().toEqualTypeOf<{}>()
  }

  if (isRoute(route, 'parentA', { exact: false })) {
    expectTypeOf<typeof route.params>().toEqualTypeOf<{} | {
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.params>().toEqualTypeOf<{} | {
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }
})
