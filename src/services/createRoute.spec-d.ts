/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { Route } from '@/types/route'
import { path } from './path'
import { query } from './query'
import { Identity } from '@/types/utilities'
import echo from '@/components/echo'
import { component } from '@/utilities/testHelpers'

test('empty options returns an empty route', () => {
  const route = createRoute({})

  expectTypeOf<typeof route>().toEqualTypeOf<Route>()
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

  type Source = typeof route['path']
  type Expect = { value: '/foo', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path and parent', () => {
  const parent = createRoute({ path: '/foo' })
  const route = createRoute({
    path: '/bar',
    parent,
  })

  type Source = typeof route['path']
  type Expect = { value: '/foo/bar', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params', () => {
  const route = createRoute({ path: '/foo/[bar]' })
  type Source = typeof route['path']
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

  type Source = typeof route['path']
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
    path: path('/foo/[bar]', { bar: Number }),
  })

  type Source = typeof route['path']
  type Expect = {
    value: '/foo/[bar]',
    params: { bar: NumberConstructor },
  }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with path with params with custom param types and parent', () => {
  const parent = createRoute({
    path: path('/parent/[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    path: path('/child/[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = typeof route['path']
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

  type Source = typeof route['query']
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

  type Source = typeof route['query']
  type Expect = { value: 'parent=parent&child=child', params: {} }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params', () => {
  const route = createRoute({ query: 'foo=[bar]' })
  type Source = typeof route['query']
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

  type Source = typeof route['query']
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
  const route = createRoute({ query: query('foo=[bar]', { bar: Number }) })
  type Source = typeof route['query']
  type Expect = { value: 'foo=[bar]', params: { bar: NumberConstructor } }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with query with params with custom param types and parent', () => {
  const parent = createRoute({
    query: query('parent=[parentParam]', { parentParam: Number }),
  })

  const route = createRoute({
    query: query('child=[childParam]', { childParam: Boolean }),
    parent,
  })

  type Source = typeof route['query']
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
  type Expect = { value: 'foo' }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('options with hash and parent', () => {
  const parent = createRoute({ hash: 'parent' })
  const route = createRoute({ hash: 'child', parent })

  type Source = typeof route['hash']
  type Expect = { value: 'parentchild' }

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
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

// test('options with component and required props with second argument with incorrect type', () => {
//   const route = createRoute({
//     component: echo,
//   // @ts-expect-error should not accept incorrect type
//   }, () => ({ value: true, foo: 'bar' }))

//   type Source = typeof route['matched']['props']
//   type Expect = () => { value: boolean, foo: string }

//   expectTypeOf<Source>().toEqualTypeOf<Expect>()
// })

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

// test('options with components and required props with second argument with incorrect type', () => {
//   const route = createRoute({
//     components: {
//       default: echo,
//     },
//   }, {
//     // @ts-expect-error should not accept incorrect type
//     default: () => ({ value: true, foo: 'bar' }),
//   })

//   type Source = typeof route['matched']['props']
//   type Expect = {
//     default: () => { value: boolean, foo: string },
//   }

//   expectTypeOf<Source>().toEqualTypeOf<Expect>()
// })

test('undefined is not a valid value for 2nd argument of createRoute', () => {
  const route = createRoute({
    component: echo,
  // @ts-expect-error should accept undefined
  }, undefined)

  type Source = typeof route['matched']['props']
  type Expect = undefined

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
