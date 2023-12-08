import { test, expectTypeOf } from 'vitest'
import { ParamGetSet } from '@/types/params'
import { Routes } from '@/types/routes'
import { createRouter, path } from '@/utilities'

const component = { template: '<div>This is component</div>' }

const boolean: ParamGetSet<boolean> = {
  get: value => Boolean(value),
  set: value => value.toString(),
}

test('requires no arguments when there are no parameters', () => {
  const routes = [
    {
      name: 'foo',
      path: '',
      component,
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
      component,
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
      component,
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
      component,
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
      component,
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
      component,
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
      component,
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo?: [string | undefined, string | undefined, string | undefined],
  }]>()
})

test('matches typed params using a Param', () => {
  const routes = [
    {
      name: 'foo',
      path: path(':foo', {
        foo: boolean,
      }),
      component,
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo).parameters.toEqualTypeOf<[{
    foo: boolean,
  }]>()
})

test('matches typed params using a ParamGetter', () => {
  const routes = [
    {
      name: 'foo',
      path: path(':foo', {
        foo: Boolean,
      }),
      component,
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
        foo: Boolean,
      }),
      component,
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
        foo: Boolean,
      }),
      component,
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
          component,
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
          component,
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
          component,
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
          component,
        },
      ],
    },
    {
      name: 'bar',
      path: '/bar',
      component,
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.foo.bar).toBeFunction()
  expectTypeOf(router.routes.bar).toBeFunction()
})

test('parent routes without a name do not appear in the routes object', () => {
  const routes = [
    {
      name: 'one',
      path: '/one',
      children: [
        {
          path: '/two',
          children: [
            {
              name: 'three',
              path: '/three',
              component,
            },
            {
              path: '/four',
              children: [
                {
                  name: 'five',
                  path: '/five',
                  component,
                },
              ],
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.one.three).toBeFunction()
  expectTypeOf(router.routes.one.five).toBeFunction()
})

test('all routes with a name can be called unless disabled', () => {
  const routes = [
    {
      name: 'parent',
      path: path('/:parent', {
        parent: boolean,
      }),
      children: [
        {
          name: 'child',
          path: '/:child',
          children: [
            {
              name: 'grandchild',
              path: '/:grandchild',
              component,
            },
          ],
        },
      ],
    },
    {
      name: 'parent2',
      path: '/parent',
      public: false,
      children: [
        {
          name: 'child2',
          path: '/child',
          component,
        },
        {
          name: 'child3',
          path: '/child3',
          public: false,
          component,
        },
      ],
    },
    {
      path: '/parent3',
      children: [
        {
          name: 'child4',
          path: '/child4',
          component,
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.parent).toBeFunction()
  expectTypeOf(router.routes.parent.child).toBeFunction()
  expectTypeOf(router.routes.parent2).not.toBeFunction()
  expectTypeOf(router.routes.parent2.child2).toBeFunction()
  expectTypeOf(router.routes.parent2.child3).not.toBeFunction()
  expectTypeOf(router.routes).not.toHaveProperty('parent3')
  expectTypeOf(router.routes.child4).toBeFunction()
})

test('public parent routes have correct type for parameters', () => {
  const routes = [
    {
      name: 'parent',
      path: path('/:param1/:param1/:param2/:param3', {
        param3: boolean,
      }),
      children: [
        {
          name: 'child',
          path: '/:param4',
          component,
        },
      ],
    },
  ] as const satisfies Routes

  const router = createRouter(routes)

  expectTypeOf(router.routes.parent).parameters.toEqualTypeOf<[{
    param1: [string, string],
    param2: string,
    param3: boolean,
  }]>()
})