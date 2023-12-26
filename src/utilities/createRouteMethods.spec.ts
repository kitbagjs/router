import { describe, expect, test } from 'vitest'
import { Routes } from '@/types'
import { createRouteMethods, resolveRoutes } from '@/utilities'

const component = { template: '<div>This is component</div>' }

describe('createRouteMethods', () => {
  test.each([
    [undefined],
    [true],
  ])('given route is named and is public, makes parent callable', () => {
    const routes = [
      {
        name: 'parent',
        path: '/parent',
        component,
      },
    ] as const satisfies Routes
    const resolved = resolveRoutes(routes)

    const response = createRouteMethods(resolved)

    expect(response.parent).toBeTypeOf('function')
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

    const response = createRouteMethods(resolved)

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

    const response = createRouteMethods(resolved)

    expect(response.child).not.toBeUndefined()
  })
})