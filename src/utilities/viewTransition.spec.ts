import { describe, expect, test } from 'vitest'
import { getViewTransitionTypes, supportsViewTransitions, supportsViewTransitionTypes } from '@/utilities/viewTransition'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { ViewTransitionContext } from '@/types/viewTransition'

const to = createResolvedRoute(createRoute({ name: 'to', path: '/to' }))
const from = createResolvedRoute(createRoute({ name: 'from', path: '/from' }))
const context: ViewTransitionContext = { to, from }

describe('getViewTransitionTypes', () => {
  test('is off when no level sets it', () => {
    expect(getViewTransitionTypes(context)).toBe(false)
  })

  test('a boolean turns it on with no types', () => {
    expect(getViewTransitionTypes({ routerViewTransition: true, ...context })).toEqual([])
  })

  test('an array of types turns it on', () => {
    expect(getViewTransitionTypes({ routerViewTransition: ['slide'], ...context })).toEqual(['slide'])
  })

  test('the nearest level decides whether it is on', () => {
    expect(getViewTransitionTypes({ routerViewTransition: true, routeViewTransition: false, ...context })).toBe(false)
    expect(getViewTransitionTypes({ routerViewTransition: false, routeViewTransition: true, ...context })).toEqual([])
    expect(getViewTransitionTypes({ routeViewTransition: true, navigationViewTransition: false, ...context })).toBe(false)
    expect(getViewTransitionTypes({ routerViewTransition: false, navigationViewTransition: true, ...context })).toEqual([])
  })

  test('types combine across every level', () => {
    const types = getViewTransitionTypes({
      routerViewTransition: ['app'],
      routeViewTransition: { types: ['page'] },
      navigationViewTransition: ['slide-left'],
      ...context,
    })

    expect(types).toEqual(['app', 'page', 'slide-left'])
  })

  test('a level that is off contributes nothing when a nearer level turns it back on', () => {
    const types = getViewTransitionTypes({
      routerViewTransition: ['app'],
      routeViewTransition: false,
      navigationViewTransition: ['slide-left'],
      ...context,
    })

    expect(types).toEqual(['app', 'slide-left'])
  })

  test('a types callback is given the navigation', () => {
    const types = getViewTransitionTypes({
      routerViewTransition: {
        types: (navigation) => [navigation.from.name, navigation.to.name],
      },
      ...context,
    })

    expect(types).toEqual(['from', 'to'])
  })

  test('a types callback returning false skips the transition', () => {
    const types = getViewTransitionTypes({
      routerViewTransition: ['app'],
      routeViewTransition: { types: () => false },
      ...context,
    })

    expect(types).toBe(false)
  })
})

describe('support', () => {
  test('nothing is supported where there is no document', () => {
    expect(supportsViewTransitions()).toBe(false)
    expect(supportsViewTransitionTypes()).toBe(false)
  })
})
