import { expectTypeOf, test } from 'vitest'
import { isRoute } from '@/guards/routes'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { query } from '@/services/query'
import { component } from '@/utilities/testHelpers'

test('router route can be narrowed', () => {
  const parentA = createRoute({
    name: 'parentA',
    path: '/parentA',
  })

  const childA = createRoute({
    parent: parentA,
    name: 'childA',
    path: '[?foo]',
    query: query('bar=[?bar]', { bar: Boolean }),
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

  const { route } = createRouter(routes)

  expectTypeOf<typeof route.name>().toMatchTypeOf<'parentA' | 'parentB' | 'childA'>()

  if (route.name === 'parentA') {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentA', { exact: true })) {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentB', { exact: true })) {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentB'>()
  }

  if (isRoute(route, 'parentA', { exact: false })) {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentA' | 'childA'>()
  }

  if (isRoute(route, 'parentB', { exact: false })) {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentB'>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.name>().toMatchTypeOf<'parentA' | 'childA'>()
  }

  if (route.name === 'parentA') {
    expectTypeOf<typeof route.params>().toMatchTypeOf<{}>()
  }

  if (isRoute(route, 'parentA', { exact: true })) {
    expectTypeOf<typeof route.params>().toMatchTypeOf<{}>()
  }

  if (isRoute(route, 'parentA', { exact: false })) {
    expectTypeOf<typeof route.params>().toMatchTypeOf<{
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.params>().toMatchTypeOf<{
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  }
})
