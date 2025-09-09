import { describe, expect, test } from 'vitest'
import { DEFAULT_PREFETCH_STRATEGY, getPrefetchConfigValue, getPrefetchOption } from './prefetch'

describe('getPrefetchOptions', () => {
  test.each([
    [undefined, 'lazy', false, 'lazy'],
    [true, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ components: true }, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ components: true }, 'eager', false, 'eager'],
    [false, 'eager', true, false],
    [{ components: false }, 'lazy', true, false],
    [{ components: true }, 'intent', true, 'intent'],
    [{ components: 'intent' }, 'lazy', true, 'intent'],
    [false, 'intent', true, false],
    [undefined, 'intent', true, 'intent'],
  ] as const)('when given [`%s`, `%s`, `%s`] returns `%s`', (linkPrefetch, routePrefetch, routerPrefetch, expected) => {
    const value = getPrefetchOption({
      linkPrefetch,
      routePrefetch,
      routerPrefetch,
    }, 'components')

    expect(value).toBe(expected)
  })
})

describe('getPrefetchConfigValue', () => {
  test.each([
    [false, false],
    [true, true],
    [undefined, undefined],
    ['lazy', 'lazy'],
    [{ components: false }, false],
    [{ components: true }, true],
    [{ components: undefined }, undefined],
    [{ components: 'lazy' }, 'lazy'],
  ] as const)('when given `%s` returns `%s`', (input, expected) => {
    const value = getPrefetchConfigValue(input, 'components')

    expect(value).toBe(expected)
  })
})
