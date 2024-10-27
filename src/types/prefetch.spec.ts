import { describe, expect, test } from 'vitest'
import { DEFAULT_PREFETCH_STRATEGY, getPrefetchConfigValue, getPrefetchOption } from '@/types/prefetch'

describe('getPrefetchOptions', () => {

  test.each([
    [undefined, 'lazy', false, 'lazy'],
    [true, false, false, DEFAULT_PREFETCH_STRATEGY],
    [true, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ components: true }, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ components: true }, 'intent', false, 'intent'],
    [false, 'intent', true, false],
    [{ components: false }, 'intent', true, false],
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