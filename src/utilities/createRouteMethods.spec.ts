import { describe, expect, test, vi } from 'vitest'
import { Routes } from '@/types'
import { createRouteMethods, resolveRoutes } from '@/utilities'
import { component } from '@/utilities/testHelpers'

test.each([
  [undefined],
  [false],
])('given route is named and is NOT disabled, makes parent callable', (isDisabled) => {
  const push = vi.fn()

  const routes = [
    {
      name: 'parent',
      path: '/parent',
      disabled: isDisabled,
      component,
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods({ resolved, push })

  expect(response.parent).toBeTypeOf('function')
})

test('given route is NOT disabled, returns empty object', () => {
  const push = vi.fn()

  const routes = [
    {
      name: 'parent',
      path: '/parent',
      disabled: false,
      component,
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods({ resolved, push })

  expect(response).toMatchObject({})
})

test.each([
  [undefined],
  [true],
  [false],
])('given parent route with named children, has property for child name', (isDisabled) => {
  const push = vi.fn()

  const routes = [
    {
      name: 'parent',
      path: '/parent',
      children: [
        {
          name: 'child',
          path: '/child',
          disabled: isDisabled,
          component,
        },
      ],
    },
  ] as const satisfies Routes
  const resolved = resolveRoutes(routes)

  const response = createRouteMethods({ resolved, push })

  if (isDisabled !== true) {
    expect(response.parent.child).toBeTypeOf('function')
  } else {
    expect(response.parent.child).not.toBeDefined()
  }
})

test('given parent route with named children and grandchildren, has path to grandchild all callable', () => {
  const push = vi.fn()

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

  const response = createRouteMethods({ resolved, push })

  expect(response.parent).toBeTypeOf('function')
  expect(response.parent.child).toBeTypeOf('function')
  expect(response.parent.child.grandchild).toBeTypeOf('function')
})

describe('routeMethod', () => {
  test('push and replace call router.push with correct parameters', () => {
    const push = vi.fn()

    const routes = [
      {
        name: 'route',
        path: '/route/:?param',
        component,
      },
    ] as const satisfies Routes
    const resolved = resolveRoutes(routes)
    const { route } = createRouteMethods({ resolved, push })

    route().push()
    expect(push).toHaveBeenLastCalledWith('/route/', {})

    route().replace()
    expect(push).toHaveBeenLastCalledWith('/route/', { replace: true })

    route({ param: 'foo' }).push()
    expect(push).toHaveBeenLastCalledWith('/route/foo', {})

    route({ param: 'foo' }).push({ params: { param: 'bar' } })
    expect(push).toHaveBeenLastCalledWith('/route/bar', {})
  })

  test('returns correct url', () => {
    const push = vi.fn()

    const routes = [
      {
        name: 'route',
        path: '/route/:?param',
        component,
      },
    ] as const satisfies Routes
    const resolved = resolveRoutes(routes)
    const { route } = createRouteMethods({ resolved, push })

    expect(route().url).toBe('/route/')
    expect(route({ param: 'param' }).url).toBe('/route/param')
  })
})