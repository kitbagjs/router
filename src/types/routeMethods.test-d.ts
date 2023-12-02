import { test, expectTypeOf } from 'vitest'
import { Param } from '@/types/params'
import { Routes } from '@/types/routes'
import { createRouter, path } from '@/utilities'

test('requires no arguments when there are no parameters', () => {
  const routes = [
    {
      name: 'foo',
      path: '',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})

test('does not match single colons as params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})

test('does not match :? as params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':?',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  router.routes.foo()

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[]>()
})

test('matches individual params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':foo',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: string,
  }]>()
})

test('matches individual optional params', () => {
  const routes = [
    {
      name: 'foo',
      path: ':?foo',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo?: string,
  }]>()
})

test('matches multiple params with the same name', () => {
  const routes = [
    {
      name: 'foo',
      path: ':foo/:?foo/:foo',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: [string, string | undefined, string],
  }]>()
})

test('matches multiple params with the same name as optional', () => {
  const routes = [
    {
      name: 'foo',
      path: ':?foo/:?foo/:?foo',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo?: [string | undefined, string | undefined, string | undefined],
  }]>()
})

test('matches typed params', () => {
  const routes = [
    {
      name: 'foo',
      path: path(':foo', {
        foo: {
          get: value => Boolean(value),
          set: value => value.toString(),
        } satisfies Param<boolean>,
      }),
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: boolean,
  }]>()
})

test('matches multiple typed params', () => {
  const routes = [
    {
      name: 'foo',
      path: path(':foo/:foo/:foo', {
        foo: {
          get: value => Boolean(value),
          set: value => value.toString(),
        } satisfies Param<boolean>,
      }),
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: [boolean, boolean, boolean],
  }]>()
})

test('matches individual as optional when matching multiple params with the same name', () => {
  const routes = [
    {
      name: 'foo',
      path: path(':foo/:?foo/:foo', {
        foo: {
          get: value => Boolean(value),
          set: value => value.toString(),
        } satisfies Param<boolean>,
      }),
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: [boolean, boolean | undefined, boolean],
  }]>()
})

test('matches params across children', () => {
  const routes = [
    {
      name: 'foo',
      path: '/:foo',
      children: [
        {
          name: 'bar',
          path: '/:bar',
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.bar).parameters.toEqualTypeOf<[{
    foo: string,
    bar: string,
  }]>()
})

test('matches multiple params with the same name across children', () => {
  const routes = [
    {
      name: 'foo',
      path: '/:foo',
      children: [
        {
          name: 'bar',
          path: '/:?foo',
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.bar).parameters.toEqualTypeOf<[{
    foo: [string, string | undefined],
  }]>()
})

test('matches multiple params with the same name as optional across children', () => {
  const routes = [
    {
      name: 'foo',
      path: '/:?foo',
      children: [
        {
          name: 'bar',
          path: '/:?foo',
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.bar).parameters.toEqualTypeOf<[{
    foo?: [string | undefined, string | undefined],
  }]>()
})

test('multiple root routes produces multiple routes', () => {
  const routes = [
    {
      name: 'foo',
      path: '/foo',
      children: [
        {
          name: 'bar',
          path: '/bar',
        },
      ],
    },
    {
      name: 'bar',
      path: '/bar',
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.bar).toBeFunction()
  expectTypeOf(router.routes.bar).toBeFunction()
})

test('parent routes without a name do not appear in the routes object', () => {
  const routes = [
    {
      name: 'foo',
      path: '/foo',
      children: [
        {
          path: '/bar',
          children: [
            {
              name: 'baz',
              path: '/baz',
            },
            {
              name: 'buz',
              path: '/buz',
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.baz).toBeFunction()
  expectTypeOf(router.routes.foo.buz).toBeFunction()
})