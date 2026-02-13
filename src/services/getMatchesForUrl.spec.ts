import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { getMatchForUrl } from '@/services/getMatchesForUrl'
import { component } from '@/utilities/testHelpers'

test('given path WITHOUT params, returns match', () => {
  const parent = createRoute({
    name: 'parent',
    path: '/parent',
  })

  const child = createRoute({
    parent: parent,
    name: 'parent.child',
    path: '/child',
  })

  const grandchild = createRoute({
    parent: child,
    name: 'parent.child.grandchild',
    path: '/grandchild',
    component,
  })

  const routes = [parent, child, grandchild]

  const match = getMatchForUrl(routes, '/parent/child/grandchild')

  expect(match).toBeDefined()
  expect(match?.name).toBe('parent.child.grandchild')
  expect(match?.matched.name).toBe('parent.child.grandchild')
})

test('given path to unnamed parent, without option to get to leaf, returns no matches', () => {
  const unnamedParent = createRoute({
    path: '/unnamed',
  })

  const unnamedChild = createRoute({
    parent: unnamedParent,
    path: '/unnamed-child/[child-id]',
  })

  const namedGrandchild = createRoute({
    parent: unnamedChild,
    path: '/named-grandchild',
    component,
  })

  const routes = [unnamedParent, unnamedChild, namedGrandchild]

  const match = getMatchForUrl(routes, '/unnamed')

  expect(match).toBeUndefined()
})

test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
  const unnamedParent = createRoute({
    path: '/unnamed',
  })

  const unnamedChildRoot = createRoute({
    parent: unnamedParent,
    name: 'child-root',
    component,
  })

  const routes = [unnamedChildRoot, unnamedParent]
  const match = getMatchForUrl(routes, '/unnamed')

  expect(match).toBeDefined()
  expect(match?.name).toBe('child-root')
})

test('given route with simple string param WITHOUT value present, returns no matches', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/simple/[simple]',
    component,
  })
  const response = getMatchForUrl([route], '/simple/')

  expect(response).toBeUndefined()
})

test('given route with simple string query param WITHOUT value present, returns no matches', () => {
  const route = createRoute({
    name: 'simple-params',
    path: '/missing',
    query: 'simple=[simple]',
    component,
  })

  const response = getMatchForUrl([route], '/missing?without=params')

  expect(response).toBeUndefined()
})

test('given route with equal matches, returns first match', () => {
  const firstRoute = createRoute({
    name: 'first-route',
    path: '/',
    component,
  })

  const secondRoute = createRoute({
    parent: firstRoute,
    name: 'second-route',
    component,
  })

  const thirdRoute = createRoute({
    name: 'third-route',
    path: '/',
    component,
  })

  const match = getMatchForUrl([
    firstRoute,
    secondRoute,
    thirdRoute,
  ], '/')

  expect(match).toBeDefined()
  expect(match?.name).toBe('first-route')
})

describe('trailing slashes', () => {
  test('given route without trailing slash, does not match url with trailing slash', () => {
    const route = createRoute({
      name: 'no-trailing-slash',
      path: '/parent/child',
      component,
    })

    const match = getMatchForUrl([route], '/parent/child/')

    expect(match).toBeUndefined()
  })

  test('given route with trailing slash, matches url without trailing slash', () => {
    const route = createRoute({
      name: 'with-trailing-slash',
      path: '/parent/child/',
      component,
    })

    const match = getMatchForUrl([route], '/parent/child')

    expect(match).toBeDefined()
    expect(match?.name).toBe('with-trailing-slash')
  })
})
