/* eslint-disable @typescript-eslint/ban-types */
import { expectTypeOf, test } from 'vitest'
import { FlattenedRoutes } from '@/types/flattened'
import { Routes } from '@/types/routes'
import { component, path } from '@/utilities'
import { query } from '@/utilities/query'

test('Returns the correct route keys', () => {
  const routes = [
    {
      name: 'parentA',
      path: '/parentA',
      children: [
        {
          name: 'childA',
          path: '/childA',
          children: [{ name: 'grandChildA', path: '/grandChildA', component }],
        },
      ],
    },
    {
      path: '/parentB',
      children: [
        {
          name: 'childB',
          path: '/childB',
          children: [{ name: 'grandChildB', path: '/grandChildB', component }],
        },
      ],
    },
    {
      name: 'parentC',
      path: '/parentC',
      children: [
        {
          name: 'childC',
          path: '/childC',
          public: false,
          children: [{ name: 'grandChildC', path: '/grandChildC', component }],
        },
      ],
    },
  ] as const satisfies Routes

  expectTypeOf<FlattenedRoutes<typeof routes>>().toMatchTypeOf<{
    parentA: {},
    'parentA.childA': {},
    'parentA.childA.grandChildA': {},
    childB: {},
    'childB.grandChildB': {},
    parentC: {},
    'parentC.grandChildC': {},
  }>()
})

test('returns correct param type for routes', () => {
  const routes = [
    {
      path: '/:A',
      children: [
        {
          path: path('/:B', {
            B: Boolean,
          }),
          children: [
            {
              name: 'grandchild',
              path: '/:A/:B/:?C',
              component,
            },
          ],
        },
      ],
    },
  ] as const satisfies Routes

  expectTypeOf<FlattenedRoutes<typeof routes>>().toMatchTypeOf<{
    grandchild: {
      B: [boolean, string],
      C?: string,
      A: [string, string],
    },
  }>()
})

test('returns correct type when query params are used', () => {
  const routes = [
    {
      path: '/:param1',
      query: query('param2=:param2', {
        param2: Boolean,
      }),
      children: [
        {
          name: 'child',
          path: path('/:param2/:?param3', {
            param3: Boolean,
          }),
          query: 'param1=:param1&param3=:?param3',
          component,
        },
      ],
    },
  ] as const satisfies Routes

  expectTypeOf<FlattenedRoutes<typeof routes>>().toMatchTypeOf<{
    child: {
      param1: [string, string],
      param2: [string, boolean],
      param3?: [boolean | undefined, string | undefined],
    },
  }>()

})