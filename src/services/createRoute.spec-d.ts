/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { Route } from '@/types/route'
import { Identity } from '@/types/utilities'
import echo from '@/components/echo'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'
import { InternalRouteHooks } from '@/types/hooks'
import { BuiltInRejectionType } from '@/services/createRouterReject'
import { createRejection } from '@/services/createRejection'
import { ResolvedRoute } from '@/types/resolved'
import { RouteRedirects } from '@/types/redirects'

test('empty options returns an empty route', () => {
  const route = createRoute({})

  type RouteWithHooks = Route & InternalRouteHooks<typeof route, []> & RouteRedirects<typeof route>

  expectTypeOf<typeof route>().toEqualTypeOf<RouteWithHooks>()
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

test('options with path', () => {
  const route = createRoute({ path: '/foo' })

  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = { value: '/foo', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path and parent', () => {
  const parent = createRoute({ path: '/foo' })
  const route = createRoute({
    path: '/bar',
    parent,
  })

  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = { value: '/foo/bar', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params', () => {
  const route = createRoute({ path: '/foo/[bar]' })
  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = { value: '/foo/[bar]', params: { bar: StringConstructor } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params and parent', () => {
  const parent = createRoute({
    path: '/parent/[parentParam]',
  })

  const route = createRoute({
    path: '/child/[childParam]',
    parent,
  })

  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = {
    value: '/parent/[parentParam]/child/[childParam]',
    params: {
      parentParam: StringConstructor,
      childParam: StringConstructor,
    },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params with custom param types', () => {
  const route = createRoute({
    path: withParams('/foo/[bar]', { bar: Number }),
  })

  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = {
    value: '/foo/[bar]',
    params: { bar: NumberConstructor },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params with custom param types and parent', () => {
  const parent = createRoute({
    path: withParams('/parent/[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    path: withParams('/child/[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = Omit<typeof route['path'], 'toString'>
  type Expect = {
    value: '/parent/[parentParam]/child/[childParam]',
    params: {
      parentParam: NumberConstructor,
      childParam: BooleanConstructor,
    },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query', () => {
  const route = createRoute({
    query: 'foo=bar',
  })

  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = { value: 'foo=bar', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query and parent', () => {
  const parent = createRoute({
    query: 'parent=parent',
  })

  const route = createRoute({
    query: 'child=child',
    parent,
  })

  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = { value: 'parent=parent&child=child', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params', () => {
  const route = createRoute({ query: 'foo=[bar]' })
  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = { value: 'foo=[bar]', params: { bar: StringConstructor } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params and parent', () => {
  const parent = createRoute({
    query: 'parent=[parentParam]',
  })

  const route = createRoute({
    query: 'child=[childParam]',
    parent,
  })

  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = {
    value: 'parent=[parentParam]&child=[childParam]',
    params: {
      parentParam: StringConstructor,
      childParam: StringConstructor,
    },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params with custom param types', () => {
  const route = createRoute({ query: withParams('foo=[bar]', { bar: Number }) })
  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = { value: 'foo=[bar]', params: { bar: NumberConstructor } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params with custom param types and parent', () => {
  const parent = createRoute({
    query: withParams('parent=[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    query: withParams('child=[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = Omit<typeof route['query'], 'toString'>
  type Expect = {
    value: 'parent=[parentParam]&child=[childParam]',
    params: {
      parentParam: NumberConstructor,
      childParam: BooleanConstructor,
    },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with hash', () => {
  const route = createRoute({ hash: 'foo' })

  type Source = typeof route['hash']
  type Expect = { value: 'foo', params: {} }

  expectTypeOf<Source>().toExtend<Expect>()
})

test('options with hash and parent', () => {
  const parent = createRoute({ hash: 'parent' })
  const route = createRoute({ hash: 'child', parent })

  type Source = typeof route['hash']
  type Expect = { value: 'parentchild' }

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

describe('props', () => {
  test('options with component and optional props without second argument', () => {
    const route = createRoute({
      component,
    })

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with component and optional props with second argument', () => {
    const route = createRoute({
      component,
    }, () => ({ foo: 'bar' }))

  type Source = typeof route['matched']['props']
  type Expect = () => { foo: string }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with component and required props missing second argument', () => {
  // @ts-expect-error should require second argument
    const route = createRoute({
      component: echo,
    })

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with component and required props with second argument ', () => {
    const route = createRoute({
      component: echo,
    }, () => ({ value: 'bar', extra: true }))

  type Source = typeof route['matched']['props']
  type Expect = () => { value: string, extra: boolean }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with component and required props with second argument with incorrect type', () => {
    const route = createRoute({
      component: echo,
      // @ts-expect-error should not accept incorrect type
    }, () => ({ value: true, foo: 'bar' }))

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with components and optional props without second argument', () => {
    const route = createRoute({
      components: {
        component,
      },
    })

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with components and optional props with second argument', () => {
    const route = createRoute({
      components: {
        default: component,
      },
    }, {
      default: () => ({ foo: 'bar' }),
    })

  type Source = typeof route['matched']['props']
  type Expect = { default: () => { foo: string } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with components and required props missing second argument', () => {
  // @ts-expect-error should require second argument
    const route = createRoute({
      components: {
        default: echo,
      },
    })

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with components and required props with second argument ', () => {
    const route = createRoute({
      components: {
        default: echo,
      },
    }, {
      default: () => ({ value: 'bar', extra: true }),
    })

  type Source = typeof route['matched']['props']
  type Expect = { default: () => { value: string, extra: boolean } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('options with components and required props with second argument with incorrect type', () => {
    const route = createRoute({
      components: {
        default: echo,
      },
    }, {
    // @ts-expect-error should not accept incorrect type
      default: () => ({ value: true, foo: 'bar' }),
    })

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('undefined is not a valid value for 2nd argument of createRoute', () => {
    const route = createRoute({
      component: echo,
      // @ts-expect-error should not accept undefined
    }, undefined)

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('parent props are undefined when parent has no props', () => {
    const parent = createRoute({
      name: 'parent',
    })

    createRoute({
      name: 'child',
      parent: parent,
    }, (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<undefined>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    })
  })

  test('sync parent props are passed to child props', () => {
    const parent = createRoute({
      name: 'parent',
    }, () => ({ foo: 123 }))

    createRoute({
      name: 'child',
      parent: parent,
    }, (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<{ foo: number }>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    })
  })

  test('async parent props are passed to child props', () => {
    const parent = createRoute({
      name: 'parent',
    }, async () => ({ foo: 123 }))

    createRoute({
      name: 'child',
      parent: parent,
    }, (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    })
  })

  test('parent props are passed to child props when multiple parent components are used', () => {
    const parent = createRoute({
      name: 'parent',
      components: {
        one: component,
        two: component,
      },
    }, {
      one: () => ({ foo: 123 }),
      two: async () => ({ foo: 456 }),
    })

    createRoute({
      name: 'child',
      parent: parent,
    }, (__, { parent }) => {
      expectTypeOf(parent.props).toEqualTypeOf<{
        one: { foo: number },
        two: Promise<{ foo: number }>,
      }>()
      expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

      return {}
    })
  })

  test('parent props are passed to child props when multiple child components are used', () => {
    const parent = createRoute({
      name: 'parent',
    }, async () => ({ foo: 123 }))

    createRoute({
      name: 'child',
      parent: parent,
      components: {
        one: component,
        two: component,
      },
    }, {
      one: (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
        expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

        return {}
      },
      two: (__, { parent }) => {
        expectTypeOf(parent.props).toEqualTypeOf<Promise<{ foo: number }>>()
        expectTypeOf(parent.name).toEqualTypeOf<'parent'>()

        return {}
      },
    })
  })

  describe('reject', () => {
    test('accepts built in rejections when no context is provided', () => {
      createRoute({
        name: 'route',
        component: echo,
      }, (__, context) => {
        type Source = Parameters<typeof context.reject>[0]
        type Expect = BuiltInRejectionType

        expectTypeOf<Source>().toEqualTypeOf<Expect>()

        return { value: 'foo' }
      })
    })

    test('accepts built in rejections and custom rejections when context is provided', () => {
      const rejection = createRejection({
        type: 'NotAuthorized',
      })

      createRoute({
        name: 'route',
        component: echo,
        context: [rejection],
      }, (__, context) => {
        type Source = Parameters<typeof context.reject>[0]
        type Expect = 'NotAuthorized' | BuiltInRejectionType

        expectTypeOf<Source>().toEqualTypeOf<Expect>()

        return { value: 'foo' }
      })
    })
  })

  describe('push', () => {
    test('accepts url when no context is provided', () => {
      createRoute({
        name: 'route',
        component: echo,
      }, (__, context) => {
        // should accept a url
        context.push('/')

        // @ts-expect-error should not accept an invalid url
        context.push('foo')

        return { value: 'foo' }
      })
    })

    test('accepts current route when no context is provided', () => {
      createRoute({
        name: 'route',
        path: '/[paramName]',
      }, (__, context) => {
        context.push('route', { paramName: 'value' })

        return {}
      })
    })

    test('accepts url and routes when context is provided', () => {
      const route = createRoute({
        name: 'contextRoute',
      })

      createRoute({
        name: 'route',
        component: echo,
        context: [route],
      }, (__, context) => {
        // valid
        context.push('route')

        // valid
        context.push('contextRoute')

        // @ts-expect-error should not accept an invalid route name
        context.push('foo')

        // should accept a url
        context.push('/')

        return { value: 'foo' }
      })
    })
  })

  describe('replace', () => {
    test('accepts url when no context is provided', () => {
      createRoute({
        name: 'route',
        component: echo,
      }, (__, context) => {
        // should accept a url
        context.replace('/')

        // @ts-expect-error should not accept an invalid url
        context.replace('foo')

        return { value: 'foo' }
      })
    })

    test('accepts url and routes when context is provided', () => {
      const route = createRoute({
        name: 'route',
      })

      createRoute({
        name: 'route',
        component: echo,
        context: [route],
      }, (__, context) => {
        // valid
        context.replace('route')

        // @ts-expect-error should not accept an invalid route name
        context.replace('foo')

        // should accept a url
        context.replace('/')

        return { value: 'foo' }
      })
    })
  })

  describe('update', () => {
    test('accepts params based on the current route', () => {
      createRoute({
        name: 'route',
        path: '/[paramName]',
        component,
      }, (__, context) => {
        context.update('paramName', 'value')

        // @ts-expect-error should not accept invalid param name
        context.update('invalidParamName', 'value')

        context.update({ paramName: 'value' })

        // @ts-expect-error should not accept invalid params
        context.update({ invalidParamName: 'value' })

        context.update({ paramName: 'value' }, { replace: true })

        // @ts-expect-error should not accept invalid options
        context.update({ paramName: 'value' }, { invalid: true })

        return {}
      })
    })
  })
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

describe('matched.meta', () => {
  test('is always defined', () => {
    const route = createRoute({
      name: 'route',
    })

    expectTypeOf(route.matched.meta).toEqualTypeOf<Readonly<{}>>()
  })

  test('preserves provided values', () => {
    const route = createRoute({
      name: 'route',
      meta: {
        foo: 'bar',
      },
    })

    expectTypeOf(route.matched.meta).toEqualTypeOf<Readonly<{ foo: 'bar' }>>()
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
      component,
    })

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
      component,
    })

    const route = createRoute({
      context: [contextRoute],
      name: 'route',
      path: '/[paramName]',
      component,
    })

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
      component,
    })

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
