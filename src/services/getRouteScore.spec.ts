import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { getRouteScore } from '@/services/getRouteScore'
import { component } from '@/utilities/testHelpers'
import { withParams } from '@/services/withParams'

describe('getRouteScore', () => {
  describe('non-matching routes return 0', () => {
    test('route path does not match url', () => {
      const route = createRoute({
        name: 'users',
        path: '/users',
        component,
      })

      const score = getRouteScore(route, '/posts')

      expect(score).toBe(0)
    })

    test('route with required param that is not satisfied', () => {
      const route = createRoute({
        name: 'user',
        path: withParams('/users/[id]', { id: Number }),
        component,
      })

      const score = getRouteScore(route, '/users/not-a-number')

      expect(score).toBe(0)
    })

    test('route query does not match url query', () => {
      const route = createRoute({
        name: 'search',
        path: '/search',
        query: 'type=posts',
        component,
      })

      const score = getRouteScore(route, '/search?type=users')

      expect(score).toBe(0)
    })

    test('route hash does not match url hash', () => {
      const route = createRoute({
        name: 'page',
        path: '/page',
        hash: '#section-a',
        component,
      })

      const score = getRouteScore(route, '/page#section-b')

      expect(score).toBe(0)
    })

    test('route host does not match url host', () => {
      const route = createExternalRoute({
        name: 'external',
        path: '/page',
        host: 'https://example.com',
      })

      const score = getRouteScore(route, 'https://other.com/page')

      expect(score).toBe(0)
    })
  })

  describe('path specificity scoring', () => {
    test('static path scores higher than parameterized path', () => {
      const staticRoute = createRoute({
        name: 'static',
        path: '/users/profile',
        component,
      })

      const paramRoute = createRoute({
        name: 'param',
        path: '/users/[id]',
        component,
      })

      const staticScore = getRouteScore(staticRoute, '/users/profile')
      const paramScore = getRouteScore(paramRoute, '/users/profile')

      expect(staticScore).toBeGreaterThan(paramScore)
    })

    test('more static characters scores higher', () => {
      const moreStatic = createRoute({
        name: 'more-static',
        path: '/users/user-[id]',
        component,
      })

      const lessStatic = createRoute({
        name: 'less-static',
        path: '/users/[id]',
        component,
      })

      const moreStaticScore = getRouteScore(moreStatic, '/users/user-123')
      const lessStaticScore = getRouteScore(lessStatic, '/users/user-123')

      expect(moreStaticScore).toBeGreaterThan(lessStaticScore)
    })

    test('route with more static segments scores higher than route with fewer', () => {
      const moreSegments = createRoute({
        name: 'more-segments',
        path: '/users/[id]/posts',
        component,
      })

      const fewerSegments = createRoute({
        name: 'fewer-segments',
        path: '/[id]',
        component,
      })

      const moreScore = getRouteScore(moreSegments, '/users/123/posts')
      const fewerScore = getRouteScore(fewerSegments, '/123')

      expect(moreScore).toBeGreaterThan(fewerScore)
    })

    test('longer static path scores higher', () => {
      const longerPath = createRoute({
        name: 'longer',
        path: '/api/v1/users/profile',
        component,
      })

      const shorterPath = createRoute({
        name: 'shorter',
        path: '/users/profile',
        component,
      })

      const longerScore = getRouteScore(longerPath, '/api/v1/users/profile')
      const shorterScore = getRouteScore(shorterPath, '/users/profile')

      expect(longerScore).toBeGreaterThan(shorterScore)
    })
  })

  describe('host specificity scoring', () => {
    test('route with explicit host scores higher than route without host', () => {
      const withHost = createExternalRoute({
        name: 'with-host',
        path: '/page',
        host: 'https://api.example.com',
      })

      const withoutHost = createRoute({
        name: 'without-host',
        path: '/page',
        component,
      })

      const withHostScore = getRouteScore(withHost, 'https://api.example.com/page')
      const withoutHostScore = getRouteScore(withoutHost, 'https://api.example.com/page')

      expect(withHostScore).toBeGreaterThan(withoutHostScore)
    })

    test('route without host gets full host points when url has no host', () => {
      const route = createRoute({
        name: 'no-host',
        path: '/page',
        component,
      })

      const score = getRouteScore(route, '/page')

      expect(score).toBeGreaterThan(80)
    })
  })

  describe('hash specificity scoring', () => {
    test('route with explicit hash scores higher than route without hash', () => {
      const withHash = createRoute({
        name: 'with-hash',
        path: '/page',
        hash: '#section',
        component,
      })

      const withoutHash = createRoute({
        name: 'without-hash',
        path: '/page',
        component,
      })

      const withHashScore = getRouteScore(withHash, '/page#section')
      const withoutHashScore = getRouteScore(withoutHash, '/page#section')

      expect(withHashScore).toBeGreaterThan(withoutHashScore)
    })

    test('route without hash gets full hash points when url has no hash', () => {
      const route = createRoute({
        name: 'no-hash',
        path: '/page',
        component,
      })

      const scoreWithoutHash = getRouteScore(route, '/page')
      const scoreWithHash = getRouteScore(route, '/page#section')

      expect(scoreWithoutHash).toBeGreaterThan(scoreWithHash)
    })

    test('hash with more static characters scores higher', () => {
      const moreStatic = createRoute({
        name: 'more-static-hash',
        path: '/page',
        hash: '#section-details',
        component,
      })

      const lessStatic = createRoute({
        name: 'less-static-hash',
        path: '/page',
        hash: '#section',
        component,
      })

      const moreStaticScore = getRouteScore(moreStatic, '/page#section-details')
      const lessStaticScore = getRouteScore(lessStatic, '/page#section')

      expect(moreStaticScore).toBeGreaterThan(lessStaticScore)
    })
  })

  describe('query specificity scoring', () => {
    test('route with explicit query scores higher than route without query', () => {
      const withQuery = createRoute({
        name: 'with-query',
        path: '/search',
        query: 'sort=date&limit=10',
        component,
      })

      const withoutQuery = createRoute({
        name: 'without-query',
        path: '/search',
        component,
      })

      const withQueryScore = getRouteScore(withQuery, '/search?sort=date&limit=10')
      const withoutQueryScore = getRouteScore(withoutQuery, '/search?sort=date&limit=10')

      expect(withQueryScore).toBeGreaterThan(withoutQueryScore)
    })

    test('route without query gets full query points when url has no query', () => {
      const route = createRoute({
        name: 'no-query',
        path: '/search',
        component,
      })

      const scoreWithoutQuery = getRouteScore(route, '/search')
      const scoreWithQuery = getRouteScore(route, '/search?foo=bar')

      expect(scoreWithoutQuery).toBeGreaterThan(scoreWithQuery)
    })

    test('query with more static characters scores higher', () => {
      const moreStatic = createRoute({
        name: 'more-static-query',
        path: '/search',
        query: 'sort=date&limit=10',
        component,
      })

      const lessStatic = createRoute({
        name: 'less-static-query',
        path: '/search',
        query: 'sort=[sort]',
        component,
      })

      const moreStaticScore = getRouteScore(moreStatic, '/search?sort=date&limit=10')
      const lessStaticScore = getRouteScore(lessStatic, '/search?sort=date&limit=10')

      expect(moreStaticScore).toBeGreaterThan(lessStaticScore)
    })
  })

  describe('optional params penalty', () => {
    test('route with unfilled optional params scores lower than filled', () => {
      const route = createRoute({
        name: 'optional',
        path: '/users/[?id]',
        component,
      })

      const filledScore = getRouteScore(route, '/users/123')
      const unfilledScore = getRouteScore(route, '/users/')

      expect(filledScore).toBeGreaterThan(unfilledScore)
    })

    test('route with multiple unfilled optional params has higher penalty', () => {
      const route = createRoute({
        name: 'two-optional',
        path: '/users',
        query: 'category=[?category]&id=[?id]',
        component,
      })

      const bothFilledScore = getRouteScore(route, '/users?category=books&id=123')
      const oneFilledScore = getRouteScore(route, '/users?category=books')
      const noneFilledScore = getRouteScore(route, '/users')

      expect(bothFilledScore).toBeGreaterThan(oneFilledScore)
      expect(oneFilledScore).toBeGreaterThan(noneFilledScore)
    })

    test('optional query params affect score', () => {
      const route = createRoute({
        name: 'optional-query',
        path: '/search',
        query: 'sort=[?sort]&limit=[?limit]',
        component,
      })

      const bothFilledScore = getRouteScore(route, '/search?sort=date&limit=10')
      const oneFilledScore = getRouteScore(route, '/search?sort=date')
      const noneFilledScore = getRouteScore(route, '/search')

      expect(bothFilledScore).toBeGreaterThan(oneFilledScore)
      expect(oneFilledScore).toBeGreaterThan(noneFilledScore)
    })
  })

  describe('score bounds', () => {
    test('matching route score is at least 25', () => {
      const minimalRoute = createRoute({
        name: 'minimal',
        path: '/[id]',
        component,
      })

      const score = getRouteScore(minimalRoute, '/123')

      expect(score).toBeGreaterThanOrEqual(25)
    })

    test('matching route score does not exceed 100', () => {
      const route = createRoute({
        name: 'specific',
        path: '/api/v1/users/profile/settings/notifications/preferences',
        component,
      })

      const score = getRouteScore(route, '/api/v1/users/profile/settings/notifications/preferences')

      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('comparing multiple routes for same url', () => {
    test('routes are ranked correctly by specificity', () => {
      const url = '/users/123/posts/456'

      const exactMatch = createRoute({
        name: 'exact',
        path: '/users/123/posts/456',
        component,
      })

      const twoParams = createRoute({
        name: 'two-params',
        path: '/users/[userId]/posts/[postId]',
        component,
      })

      const oneParam = createRoute({
        name: 'one-param',
        path: '/users/[userId]/posts/456',
        component,
      })

      const exactScore = getRouteScore(exactMatch, url)
      const oneParamScore = getRouteScore(oneParam, url)
      const twoParamsScore = getRouteScore(twoParams, url)

      expect(exactScore).toBeGreaterThan(oneParamScore)
      expect(oneParamScore).toBeGreaterThan(twoParamsScore)
    })

    test('complex url with host, query, and hash ranks correctly', () => {
      const url = 'https://api.example.com/users/123?sort=date#details'

      const fullMatch = createExternalRoute({
        name: 'full-match',
        host: 'https://api.example.com',
        path: '/users/[id]',
        query: 'sort=date',
        hash: '#details',
      })

      const noHash = createExternalRoute({
        name: 'no-hash',
        host: 'https://api.example.com',
        path: '/users/[id]',
        query: 'sort=date',
      })

      const noQuery = createExternalRoute({
        name: 'no-query',
        host: 'https://api.example.com',
        path: '/users/[id]',
        hash: '#details',
      })

      const noHost = createRoute({
        name: 'no-host',
        path: '/users/[id]',
        query: 'sort=date',
        hash: '#details',
        component,
      })

      const fullScore = getRouteScore(fullMatch, url)
      const noHashScore = getRouteScore(noHash, url)
      const noQueryScore = getRouteScore(noQuery, url)
      const noHostScore = getRouteScore(noHost, url)

      expect(fullScore).toBeGreaterThan(noHashScore)
      expect(fullScore).toBeGreaterThan(noQueryScore)
      expect(fullScore).toBeGreaterThan(noHostScore)
    })
  })

  describe('edge cases', () => {
    test('root path matches and scores', () => {
      const route = createRoute({
        name: 'root',
        path: '/',
        component,
      })

      const score = getRouteScore(route, '/')

      expect(score).toBeGreaterThan(0)
    })

    test('empty hash in url does not penalize route without hash', () => {
      const route = createRoute({
        name: 'no-hash',
        path: '/page',
        component,
      })

      const scoreNoHash = getRouteScore(route, '/page')
      const scoreEmptyHash = getRouteScore(route, '/page#')

      expect(scoreNoHash).toBe(scoreEmptyHash)
    })

    test('empty query in url does not penalize route without query', () => {
      const route = createRoute({
        name: 'no-query',
        path: '/page',
        component,
      })

      const scoreNoQuery = getRouteScore(route, '/page')
      const scoreEmptyQuery = getRouteScore(route, '/page?')

      expect(scoreNoQuery).toBe(scoreEmptyQuery)
    })

    test('params in host are handled correctly', () => {
      const staticHost = createExternalRoute({
        name: 'static-host',
        host: 'https://api.example.com',
        path: '/page',
      })

      const paramHost = createExternalRoute({
        name: 'param-host',
        host: withParams('https://[subdomain].example.com', {}),
        path: '/page',
      })

      const staticScore = getRouteScore(staticHost, 'https://api.example.com/page')
      const paramScore = getRouteScore(paramHost, 'https://api.example.com/page')

      expect(staticScore).toBeGreaterThan(paramScore)
    })
  })
})
