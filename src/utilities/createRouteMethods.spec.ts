import { describe, expect, test, vi } from 'vitest'
import { Routes } from '@/types'
import { createRouteMethods, resolveRoutes } from '@/utilities'
import { component } from '@/utilities/testHelpers'

test.each([
  [undefined],
  [true],
])('given route is named and is public, makes parent callable', (isPublic) => {
  const routes = [
    {
      name: 'parent',
      path: '/parent',
      public: isPublic,
      component,
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods<typeof routes>(resolved, vi.fn())

  if (isPublic !== false) {
    // @ts-expect-error
    expect(response.parent).toBeTypeOf('function')
  } else {
    // @ts-expect-error
    expect(response.parent).not.toBeDefined()
  }

})

test('given route is NOT public, returns empty object', () => {
  const routes = [
    {
      name: 'parent',
      path: '/parent',
      public: false,
      component,
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods<typeof routes>(resolved, vi.fn())

  expect(response).toMatchObject({})
})

test.each([
  [undefined],
  [true],
  [false],
])('given parent route with named children, has property for child name', (isPublic) => {
  const routes = [
    {
      name: 'parent',
      path: '/parent',
      children: [
        {
          name: 'child',
          path: '/child',
          public: isPublic,
          component,
        },
      ],
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods<typeof routes>(resolved, vi.fn())

  if (isPublic !== false) {
    // @ts-expect-error
    expect(response.parent.child).toBeTypeOf('function')
  } else {
    // @ts-expect-error
    expect(response.parent.child).not.toBeDefined()
  }
})

test('given parent route with named children and grandchildren, has path to grandchild all callable', () => {
  const routes = [
    {
      name: 'parent',
      path: '/parent',
      children: [
        {
          name: 'child',
          path: '/child',
          children: [
            {
              name: 'grandchild',
              path: '/grandchild',
              component,
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods<typeof routes>(resolved, vi.fn())

  expect(response.parent).toBeTypeOf('function')
  expect(response.parent.child).toBeTypeOf('function')
  expect(response.parent.child.grandchild).toBeTypeOf('function')
})

describe('routeMethod', () => {
  test('push and replace call router.push with correct parameters', () => {
    const routerPush = vi.fn()

    const routes = [
      {
        name: 'route',
        path: '/route/:?param',
        component,
      },
    ] as const satisfies Routes
    const resolved = resolveRoutes(routes)
    const { route } = createRouteMethods<typeof routes>(resolved, routerPush)

    route().push()
    expect(routerPush).toHaveBeenLastCalledWith('/route/', {})

    route().replace()
    expect(routerPush).toHaveBeenLastCalledWith('/route/', { replace: true })

    route({ param: 'foo' }).push()
    expect(routerPush).toHaveBeenLastCalledWith('/route/foo', {})

    route({ param: 'foo' }).push({ params: { param: 'bar' } })
    expect(routerPush).toHaveBeenLastCalledWith('/route/bar', {})
  })

  test('returns correct url', () => {
    const routerPush = vi.fn()

    const routes = [
      {
        name: 'route',
        path: '/route/:?param',
        component,
      },
    ] as const satisfies Routes
    const resolved = resolveRoutes(routes)
    const { route } = createRouteMethods<typeof routes>(resolved, routerPush)

    expect(route().url).toBe('/route/')
    expect(route({ param: 'param' }).url).toBe('/route/param')
  })
})