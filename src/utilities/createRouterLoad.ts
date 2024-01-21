import { test } from 'vitest'
import { Routes } from '@/types'
import { createRouter } from '@/utilities/createRouter'
import { component } from '@/utilities/testHelpers'

function routesFactory<const T extends string, const R extends Routes>(prefix: T, children: R) {
  const routes = [
    {
      name: `${prefix}-one`,
      path: `/:${prefix}-one/:${prefix}-b-one/:${prefix}-c-one/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-two`,
      path: `/:${prefix}-two/:${prefix}-b-two/:${prefix}-c-two/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-three`,
      path: `/:${prefix}-three/:${prefix}-b-three/:${prefix}-c-three/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-four`,
      path: `/:${prefix}-four/:${prefix}-b-four/:${prefix}-c-four/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-five`,
      path: `/:${prefix}-five/:${prefix}-b-five/:${prefix}-c-five/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-six`,
      path: `/:${prefix}-six/:${prefix}-b-six/:${prefix}-c-six/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-seven`,
      path: `/:${prefix}-seven/:${prefix}-b-seven/:${prefix}-c-seven/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-eight`,
      path: `/:${prefix}-eight/:${prefix}-b-eight/:${prefix}-c-eight/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-nine`,
      path: `/:${prefix}-nine/:${prefix}-b-nine/:${prefix}-c-nine/:foo`,
      component,
      children,
    },
    {
      name: `${prefix}-ten`,
      path: `/:${prefix}-ten/:${prefix}-b-ten/:${prefix}-c-ten/:foo`,
      component,
      children,
    },
  ] as const satisfies Routes

  return routes
}

test('works with lots of params', () => {
  const routes = [
    ...routesFactory('A', routesFactory('B', [{ name: 'C', path: '/C', component }])),
    // ...routesFactory('C', routesFactory('D', [{ name: 'D', path: '/C', component }])),
    // ...routesFactory('E', routesFactory('F', [{ name: 'D', path: '/C', component }])),
  ] as const satisfies Routes

  const router = createRouter(routes)

  // router.push({ route: 'one'})

  router.routes['A-eight']['B-eight'].C({
    'A-eight': '',
    'B-eight': '',
  })
  // router.routes.two()
  // router.routes.two.three()
})