import { describe, expectTypeOf, test } from 'vitest'
import { createUseRoute } from '@/compositions/useRoute'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'

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

const parentB = createRoute({
  name: 'parentB',
  path: '/parentB',
  component,
})

const routes = [parentA, childA, parentB] as const

const { key } = createRouter(routes)
const useRoute = createUseRoute(key)

test('without arguments returns full route union', () => {
  const route = useRoute()

  expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'childA' | 'parentB'>()
})

describe('with exact', () => {
  test('narrows to exact route name', () => {
    const route = useRoute('parentA', { exact: true })

    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA'>()
  })

  test('narrows params', () => {
    const routeA = useRoute('parentA', { exact: true })

    expectTypeOf<typeof routeA.params>().toEqualTypeOf<{}>()

    const routeChild = useRoute('childA', { exact: true })

    expectTypeOf<typeof routeChild.params>().toEqualTypeOf<{
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  })
})

describe('without exact', () => {
  test('narrows to route and descendants', () => {
    const route = useRoute('parentA')

    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'childA'>()
  })

  test('narrows params to include descendants', () => {
    const route = useRoute('parentA')

    expectTypeOf<typeof route.params>().toEqualTypeOf<{} | {
      foo?: string | undefined,
      bar?: boolean | undefined,
    }>()
  })

  test('for leaf route narrows to just that route', () => {
    const route = useRoute('parentB')

    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentB'>()
  })

  test('with explicit exact false behaves same as without exact', () => {
    const route = useRoute('parentA', { exact: false })

    expectTypeOf<typeof route.name>().toEqualTypeOf<'parentA' | 'childA'>()
  })
})

test('discord', () => {
  const parent = createRoute({
    path: '/',
    component,
    // name: 'parent', // no name causes the issue, if there is a name then it narrows the route correctly
  })

  const childA = createRoute({
    parent: parent,
    name: 'childA',
    component,
  })

  const childB = createRoute({
    parent: parent,
    name: 'childB',
    component,
  })

  const grandChild = createRoute({
    parent: childA,
    name: 'grandChild',
    component,
  })

  const routes = [
    parent,
    childA,
    childB,
    grandChild,
  ] as const

  const { key } = createRouter(routes)
  const useRoute = createUseRoute(key)

  const anyRoute = useRoute()

  expectTypeOf<typeof anyRoute.name>().toEqualTypeOf<'childA' | 'childB' | 'grandChild'>()

  const childARoute = useRoute('childA')

  expectTypeOf<typeof childARoute.name>().toEqualTypeOf<'childA' | 'grandChild'>()

  const childBRoute = useRoute('childB')

  expectTypeOf<typeof childBRoute.name>().toEqualTypeOf<'childB'>()

  const grandChildRoute = useRoute('grandChild')

  expectTypeOf<typeof grandChildRoute.name>().toEqualTypeOf<'grandChild'>()
})
