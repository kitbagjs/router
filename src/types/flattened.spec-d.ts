/* eslint-disable @typescript-eslint/ban-types */
import { expectTypeOf, test } from 'vitest'
import { Flattened, Routes } from '.'
import { component, path } from '@/utilities'

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

  expectTypeOf<Flattened<typeof routes>>().toMatchTypeOf<{
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

  expectTypeOf<Flattened<typeof routes>>().toMatchTypeOf<{
    grandchild: {
      B: [boolean, string],
      C?: string,
      A: [string, string],
    },
  }>()
})