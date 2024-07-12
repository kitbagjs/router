import { expectTypeOf, test } from 'vitest'
import { isRoute } from '@/guards/routes'
import { createRouter, createRoutes, query } from '@/services'
import { component } from '@/utilities/testHelpers'

test('router route can be narrowed', () => {
  const routes = createRoutes([
    {
      name: 'parentA',
      path: '/parentA',
      children: createRoutes([
        {
          name: 'childA',
          path: '[?foo]',
          query: query('bar=[?bar]', { bar: Boolean }),
          component,
        },
      ]),
    },
    {
      name: 'parentB',
      path: '/parentB',
      component,
    },
  ])

  const { route } = createRouter(routes)

  expectTypeOf<typeof route.key>().toMatchTypeOf<'parentA' | 'parentB' | 'parentA.childA'>()

  if (route.key === 'parentA') {
    expectTypeOf<typeof route.key>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentA', { exact: true })) {
    expectTypeOf<typeof route.key>().toMatchTypeOf<'parentA'>()
  }

  if (isRoute(route, 'parentA', { exact: false })) {
    expectTypeOf<typeof route.key>().toMatchTypeOf<'parentA' | 'parentA.childA'>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.key>().toMatchTypeOf<'parentA' | 'parentA.childA'>()
  }

  if (route.key === 'parentA') {
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