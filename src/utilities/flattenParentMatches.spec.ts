import { expect, test } from 'vitest'
import { Route } from '@/types'
import { flattenParentMatches } from '@/utilities/flattenParentMatches'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { component } from '@/utilities/testHelpers'

test('given no public routes, returns empty string', () => {
  const child = {
    name: 'child',
    path: '/child',
    public: false,
    component,
  } as const satisfies Route

  const parent = {
    name: 'parent',
    path: '/parent',
    public: false,
    children: [child],
  } as const satisfies Route

  const grandparent = {
    name: 'grandparent',
    path: '/grandparent',
    public: false,
    children: [parent],
  } as const satisfies Route

  const [resolved] = resolveRoutes([grandparent])
  const flattened = flattenParentMatches(resolved)

  expect(flattened).toBe('')
})

test('given named and public routes, returns those routes joined by period', () => {
  const child = {
    name: 'child',
    path: '/child',
    children: [],
  } as const satisfies Route

  const parent = {
    name: 'parent',
    path: '/parent',
    public: false,
    children: [child],
  } as const satisfies Route

  const grandparent = {
    name: 'grandparent',
    path: '/grandparent',
    children: [parent],
  } as const satisfies Route

  const [resolved] = resolveRoutes([grandparent])
  const flattened = flattenParentMatches(resolved)

  expect(flattened).toBe('grandparent.child')
})