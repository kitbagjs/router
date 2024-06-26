import { expectTypeOf, test } from 'vitest'
import { isRoute } from '@/guards/routes'
import { createRouter, createRoutes } from '@/services'
import { component } from '@/utilities/testHelpers'

test('router route can be narrowed', () => {
  const routes = createRoutes([
    {
      name: 'parentA',
      path: '/parentA',
      children: createRoutes([
        {
          component,
          name: 'childA',
          path: '/childA/[childA]',
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
    expectTypeOf<typeof route.params>().toMatchTypeOf<{} | {
      childA: string,
    }>()
  }

  if (isRoute(route, 'parentA')) {
    expectTypeOf<typeof route.params>().toMatchTypeOf<{} |{
      childA: string,
    }>()
  }
})