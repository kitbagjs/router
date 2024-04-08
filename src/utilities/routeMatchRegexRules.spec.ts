import { describe, expect, test } from 'vitest'
import { createRoutes, routePathMatches, routeQueryMatches } from '@/utilities'
import { component } from '@/utilities/testHelpers'

describe('routePathMatches', () => {
  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/is/empty'],
    ['http://www.kitbag.io/is/empty?with=query'],
  ])('given url and route.path that does NOT match, returns false', (url) => {
    const route = {
      name: 'not-matches',
      path: '/not/empty',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routePathMatches(routerRoutes, url)

    expect(response).toBe(false)
  })

  test.each([
    ['/without/params'],
    ['http://www.kitbag.io/without/params'],
  ])('given url and route.path WITHOUT params that does match, returns true', (url) => {
    const route = {
      name: 'no-params',
      path: '/without/params',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routePathMatches(routerRoutes, url)

    expect(response).toBe(true)
  })

  test('route matching logic is case insensitive', () => {
    const route = {
      name: 'no-params',
      path: '/without/params',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routePathMatches(routerRoutes, '/WITHOUT/params')

    expect(response).toBe(true)
  })

  test.each([
    ['/with/true/params/true'],
    ['/with/%/params/%'],
    ['http://www.kitbag.io/with/a/params/b'],
  ])('given url and route.path with params that does match, returns true', (url) => {
    const route = {
      name: 'no-params',
      path: '/with/:some/params/:inPath',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routePathMatches(routerRoutes, url)

    expect(response).toBe(true)
  })

  test('given route with extra slashes in param value, does NOT match', () => {
    const route = {
      name: 'support-slashes',
      path: '/supports/:slashes/bookmarked',
      component,
    }

    const [routerRoutes] = createRoutes([route])
    const response = routePathMatches(routerRoutes, '/supports/first/second/third/bookmarked')

    expect(response).toBe(false)
  })
})

describe('routeQueryMatches', () => {
  test.each([
    ['we*23mf#0'],
    ['http://www.kitbag.io'],
    ['http://www.kitbag.io/'],
    ['http://www.kitbag.io/is/empty'],
    ['http://www.kitbag.io/is/empty?with=query'],
  ])('given url and route.query that does NOT match, returns false', (url) => {
    const route = {
      name: 'not-matches',
      path: '',
      query: 'not=empty',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routeQueryMatches(routerRoutes, url)

    expect(response).toBe(false)
  })

  test.each([
    ['?without=params&static=true'],
    ['http://www.kitbag.io?without=params&static=true'],
  ])('given url and route.query WITHOUT params that does match, returns true', (url) => {
    const route = {
      name: 'no-params',
      path: '',
      query: 'without=params&static=true',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routeQueryMatches(routerRoutes, url)

    expect(response).toBe(true)
  })

  test.each([
    ['?with=true&static=false'],
    ['?with=%20&static=%20'],
    ['http://www.kitbag.io?with=a&static=b'],
    ['http://www.kitbag.io/some/path?with=a&static=b'],
  ])('given url and route.query with params that does match, returns true', (url) => {
    const route = {
      name: 'no-params',
      path: '',
      query: 'with=:params&static=:dynamic',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routeQueryMatches(routerRoutes, url)

    expect(response).toBe(true)
  })

  test('given url that as additional unexpected query params, returns true', () => {
    const route = {
      name: 'extra-params',
      path: '',
      query: 'expected=value',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routeQueryMatches(routerRoutes, 'www.kitbag.io/some/path?expected=value&unexpected=ok')

    expect(response).toBe(true)
  })

  test('given url with query params in random order, returns true', () => {
    const route = {
      name: 'extra-params',
      path: '',
      query: 'first=1&second=2&third=3',
      component,
    }
    const [routerRoutes] = createRoutes([route])

    const response = routeQueryMatches(routerRoutes, 'www.kitbag.io/some/path?second=2&first=1&third=3')

    expect(response).toBe(true)
  })
})