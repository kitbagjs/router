import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { Identity } from '@/types/utilities'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'
import { InternalRouteHooks } from '@/types/hooks'
import { createRejection } from '@/services/createRejection'
import { ResolvedRoute } from '@/types/resolved'
import { RouteRedirects } from '@/types/redirects'
import { RouteSetTitle } from '@/types/routeTitle'
import { Url } from '@/types/url'

describe('route shape', () => {
  // a route carries the same members however it was built, so each case asserts against both
  const cases = {
    plain: createRoute({}),
    withView: createRoute({}).addView(component),
    withNamedView: createRoute({}).addView(component, { name: 'sidebar' }),
    withProps: createRoute({}).addView(component, { props: () => ({ foo: 'bar' }) }),
  }

  test('is a url', () => {
    expectTypeOf(cases.plain).toExtend<Url>()
    expectTypeOf(cases.withView).toExtend<Url>()
    expectTypeOf(cases.withNamedView).toExtend<Url>()
    expectTypeOf(cases.withProps).toExtend<Url>()
  })

  test('has hooks', () => {
    expectTypeOf(cases.plain).toExtend<InternalRouteHooks>()
    expectTypeOf(cases.withView).toExtend<InternalRouteHooks>()
    expectTypeOf(cases.withNamedView).toExtend<InternalRouteHooks>()
    expectTypeOf(cases.withProps).toExtend<InternalRouteHooks>()
  })

  test('has redirects', () => {
    expectTypeOf(cases.plain).toExtend<RouteRedirects>()
    expectTypeOf(cases.withView).toExtend<RouteRedirects>()
    expectTypeOf(cases.withNamedView).toExtend<RouteRedirects>()
    expectTypeOf(cases.withProps).toExtend<RouteRedirects>()
  })

  test('has setTitle', () => {
    expectTypeOf(cases.plain).toExtend<RouteSetTitle>()
    expectTypeOf(cases.withView).toExtend<RouteSetTitle>()
    expectTypeOf(cases.withNamedView).toExtend<RouteSetTitle>()
    expectTypeOf(cases.withProps).toExtend<RouteSetTitle>()
  })

  test('is chainable', () => {
    expectTypeOf(cases.plain.addView).toBeFunction()
    expectTypeOf(cases.withView.addView).toBeFunction()
    expectTypeOf(cases.withNamedView.addView).toBeFunction()
    expectTypeOf(cases.withProps.addView).toBeFunction()
  })
})

test('options with name', () => {
  const route = createRoute({ name: 'foo' })
  type Source = typeof route['name']
  type Expect = 'foo'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with name and parent', () => {
  const parent = createRoute({ name: 'parent' })
  const route = createRoute({
    name: 'child',
    parent,
  })

  type Source = typeof route['name']
  type Expect = 'child'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params', () => {
  const route = createRoute({ path: '/foo/[bar]' })
  type Source = typeof route['params']
  type Expect = { bar: { param: StringConstructor, isOptional: false, isGreedy: false } }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with path with params and parent', () => {
  const parent = createRoute({
    path: '/parent/[parentParam]',
  })

  const route = createRoute({
    path: '/child/[childParam]',
    parent,
  })

  type Source = typeof route['params']
  type Expect = {
    parentParam: { param: StringConstructor, isOptional: false, isGreedy: false },
    childParam: { param: StringConstructor, isOptional: false, isGreedy: false },
  }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with path with params with custom param types', () => {
  const route = createRoute({
    path: withParams('/foo/[bar]', { bar: Number }),
  })

  type Source = typeof route['params']
  type Expect = {
    bar: { param: NumberConstructor, isOptional: false, isGreedy: false },
  }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with path with params with custom param types and parent', () => {
  const parent = createRoute({
    path: withParams('/parent/[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    path: withParams('/child/[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = typeof route['params']
  type Expect = {
    parentParam: { param: NumberConstructor, isOptional: false, isGreedy: false },
    childParam: { param: BooleanConstructor, isOptional: false, isGreedy: false },
  }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query', () => {
  const route = createRoute({
    query: 'foo=bar',
  })

  type Source = typeof route['params']
  type Expect = {}

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query and parent', () => {
  const parent = createRoute({
    query: 'parent=parent',
  })

  const route = createRoute({
    query: 'child=child',
    parent,
  })

  type Source = typeof route['params']
  type Expect = {}

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query with params', () => {
  const route = createRoute({ query: 'foo=[bar]' })
  type Source = typeof route['params']
  type Expect = { bar: { param: StringConstructor, isOptional: false, isGreedy: false } }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query with params and parent', () => {
  const parent = createRoute({
    query: 'parent=[parentParam]',
  })

  const route = createRoute({
    query: 'child=[childParam]',
    parent,
  })

  type Source = typeof route['params']
  type Expect = {
    parentParam: { param: StringConstructor, isOptional: false, isGreedy: false },
    childParam: { param: StringConstructor, isOptional: false, isGreedy: false },
  }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query with params with custom param types', () => {
  const route = createRoute({ query: withParams('foo=[bar]', { bar: Number }) })
  type Source = typeof route['params']
  type Expect = { bar: { param: NumberConstructor, isOptional: false, isGreedy: false } }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with query with params with custom param types and parent', () => {
  const parent = createRoute({
    query: withParams('parent=[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    query: withParams('child=[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = typeof route['params']
  type Expect = {
    parentParam: { param: NumberConstructor, isOptional: false, isGreedy: false },
    childParam: { param: BooleanConstructor, isOptional: false, isGreedy: false },
  }

  expectTypeOf<Source>().toMatchObjectType<Expect>()
})

test('options with hash', () => {
  const route = createRoute({ hash: 'foo' })

  type Source = typeof route['params']
  type Expect = {}

  expectTypeOf<Source>().toExtend<Expect>()
})

test('options with hash and parent', () => {
  const parent = createRoute({ hash: 'parent' })
  const route = createRoute({ hash: 'child', parent })

  type Source = typeof route['params']
  type Expect = {}

  expectTypeOf<Source>().toExtend<Expect>()
})

test('options with meta', () => {
  const route = createRoute({ meta: { foo: 'bar' } })
  type Source = typeof route['meta']
  type Expect = Readonly<{ foo: 'bar' }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with meta and parent', () => {
  const parent = createRoute({ meta: { parent: 'parent' } })
  const route = createRoute({ parent, meta: { child: 'child' } })

  type Source = Identity<typeof route['meta']>
  type Expect = Readonly<{ parent: 'parent', child: 'child' }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with state', () => {
  const route = createRoute({ state: { foo: String } })
  type Source = typeof route['state']
  type Expect = Readonly<{ foo: StringConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with state and parent', () => {
  const parent = createRoute({ state: { parent: String } })
  const route = createRoute({ parent, state: { child: String } })

  type Source = Identity<typeof route['state']>
  type Expect = Readonly<{ parent: StringConstructor, child: StringConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('meta', () => {
  test('is always defined', () => {
    const route = createRoute({
      name: 'route',
    })

    expectTypeOf(route.meta).toEqualTypeOf<Readonly<{}>>()
  })

  test('preserves provided values', () => {
    const route = createRoute({
      name: 'route',
      meta: {
        foo: 'bar',
      },
    })

    expectTypeOf(route.meta).toEqualTypeOf<Readonly<{ foo: 'bar' }>>()
  })

  test('preserves provided values with parent', () => {
    const parent = createRoute({
      name: 'parent',
      meta: {
        foo: 'bar',
      },
    })

    const route = createRoute({
      name: 'child',
      parent: parent,
      meta: {
        bar: 'baz',
      },
    })

    expectTypeOf(parent.meta).toExtend<{}>()
    expectTypeOf(route.meta.bar).toEqualTypeOf<'baz'>()
    expectTypeOf(route.meta.foo).toEqualTypeOf<'bar'>()
  })
})

describe('matches[number].meta', () => {
  test('is always defined', () => {
    const route = createRoute({
      name: 'route',
    })

    expectTypeOf(route.matches[0].meta).toEqualTypeOf<Readonly<{}>>()
  })

  test('preserves provided values', () => {
    const route = createRoute({
      name: 'route',
      meta: {
        foo: 'bar',
      },
    })

    expectTypeOf(route.matches[0].meta).toEqualTypeOf<Readonly<{ foo: 'bar' }>>()
  })
})

describe('hooks', () => {
  test('to and from are typed correctly', () => {
    const route = createRoute({
      name: 'route',
      path: '/[paramName]',
    })
      .addView(component)

    route.onBeforeRouteEnter((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute<typeof route>>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    })

    route.onBeforeRouteUpdate((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute<typeof route>>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    })

    route.onBeforeRouteLeave((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute<typeof route>>()
    })

    route.onAfterRouteEnter((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute<typeof route>>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    })

    route.onAfterRouteUpdate((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute<typeof route>>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    })

    route.onAfterRouteLeave((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute<typeof route>>()
    })
  })

  test('context.push', () => {
    const contextRoute = createRoute({
      name: 'contextRoute',
    })
      .addView(component)

    const route = createRoute({
      context: [contextRoute],
      name: 'route',
      path: '/[paramName]',
    })
      .addView(component)

    route.onBeforeRouteEnter((_to, context) => {
      // valid - current route
      context.push('route', { paramName: 'value' })

      // valid - context route
      context.push('contextRoute')

      // @ts-expect-error should not accept an invalid route name
      context.push('foo')

      // @ts-expect-error should not accept an invalid param
      context.push('route', { invalidParamName: 'value' })
    })
  })
  test('context.update', () => {
    const route = createRoute({
      name: 'route',
      path: '/[paramName]',
    })
      .addView(component)

    route.onBeforeRouteEnter((_to, context) => {
      context.update('paramName', 'value')

      // @ts-expect-error should not accept invalid param name
      context.update('invalidParamName', 'value')

      context.update({ paramName: 'value' })

      // @ts-expect-error should not accept invalid params
      context.update({ invalidParamName: 'value' })

      context.update({ paramName: 'value' }, { replace: true })

      // @ts-expect-error should not accept invalid options
      context.update({ paramName: 'value' }, { invalid: true })
    })
  })
})

test('given parent, context is combined', () => {
  const parentRejection = createRejection({ type: 'aRejection' })
  const childRelated = createRoute({ name: 'bRoute' })

  const parent = createRoute({
    meta: {
      foo: 123,
    },
    context: [parentRejection],
  })

  const child = createRoute({
    parent,
    context: [childRelated],
    meta: {
      bar: 'zoo',
    },
  })

  child.onAfterRouteEnter((_to, { push, reject }) => {
    expectTypeOf(reject).parameters.toEqualTypeOf<['NotFound' | 'aRejection']>()

    // ok
    push('bRoute')
    // @ts-expect-error should not accept an invalid route name
    push('fakeRoute')
  })
})
