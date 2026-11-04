import { describe, expect, test } from 'vitest'
import { DEFAULT_PREFETCH_STRATEGY, getPrefetchConfigValue, getPrefetchOption } from './prefetch'

describe('getPrefetchOptions', () => {
  test.each([
    [undefined, 'lazy', false, 'lazy'],
    [true, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ component: true }, false, false, DEFAULT_PREFETCH_STRATEGY],
    [{ component: true }, 'eager', false, 'eager'],
    [false, 'eager', true, false],
    [{ component: false }, 'lazy', true, false],
    [{ component: true }, 'intent', true, 'intent'],
    [{ component: 'intent' }, 'lazy', true, 'intent'],
    [false, 'intent', true, false],
    [undefined, 'intent', true, 'intent'],
  ] as const)('when given [`%s`, `%s`, `%s`] returns `%s`', (linkPrefetch, routePrefetch, routerPrefetch, expected) => {
    const value = getPrefetchOption({
      linkPrefetch,
      routePrefetch,
      routerPrefetch,
    }, 'component')

    expect(value).toBe(expected)
  })

  test.each([
    [undefined, false, true, true, false],
    [undefined, 'eager', 'lazy', true, 'eager'],
    [undefined, true, 'intent', false, 'intent'],
    [undefined, { component: false }, true, true, false],
    [undefined, undefined, 'lazy', true, 'lazy'],
    ['intent', 'eager', false, false, 'intent'],
    [true, false, undefined, undefined, DEFAULT_PREFETCH_STRATEGY],
  ] as const)('when given [`%s`, `%s`, `%s`, `%s`] returns `%s`', (linkPrefetch, viewPrefetch, routePrefetch, routerPrefetch, expected) => {
    const value = getPrefetchOption({
      linkPrefetch,
      viewPrefetch,
      routePrefetch,
      routerPrefetch,
    }, 'component')

    expect(value).toBe(expected)
  })

  test('a view config can split components and props', () => {
    const configs = {
      viewPrefetch: { component: 'eager', props: false },
      routePrefetch: true,
    } as const

    expect(getPrefetchOption(configs, 'component')).toBe('eager')
    expect(getPrefetchOption(configs, 'props')).toBe(false)
  })

  test('only components are prefetched by default', () => {
    expect(getPrefetchOption({}, 'component')).toBe(DEFAULT_PREFETCH_STRATEGY)
    expect(getPrefetchOption({}, 'props')).toBe(false)
    expect(getPrefetchOption({}, 'loader')).toBe(false)
  })

  test('object configs control each kind independently', () => {
    const configs = {
      routerPrefetch: { component: false, props: 'eager', loader: 'intent' },
    } as const

    expect(getPrefetchOption(configs, 'component')).toBe(false)
    expect(getPrefetchOption(configs, 'props')).toBe('eager')
    expect(getPrefetchOption(configs, 'loader')).toBe('intent')
    expect(getPrefetchOption({ routerPrefetch: { props: 'eager' } }, 'loader')).toBe(false)
    expect(getPrefetchOption({ routerPrefetch: { loader: 'eager' } }, 'props')).toBe(false)
  })

  test('each kind inherits and overrides its own setting', () => {
    const configs = {
      routerPrefetch: { component: 'lazy', props: 'eager', loader: 'intent' },
      routePrefetch: { props: false },
      viewPrefetch: { loader: true },
      linkPrefetch: { component: false },
    } as const

    expect(getPrefetchOption(configs, 'component')).toBe(false)
    expect(getPrefetchOption(configs, 'props')).toBe(false)
    expect(getPrefetchOption(configs, 'loader')).toBe('intent')
    expect(getPrefetchOption({ ...configs, linkPrefetch: { loader: false } }, 'props')).toBe(false)
    expect(getPrefetchOption({ ...configs, linkPrefetch: { loader: false } }, 'loader')).toBe(false)
  })

  test.each(['component', 'props', 'loader'] as const)('scalar configs apply to %s', (setting) => {
    expect(getPrefetchOption({ routerPrefetch: true }, setting)).toBe(DEFAULT_PREFETCH_STRATEGY)
    expect(getPrefetchOption({ routerPrefetch: false }, setting)).toBe(false)
    expect(getPrefetchOption({ routerPrefetch: 'eager' }, setting)).toBe('eager')
  })
})

describe('getPrefetchConfigValue', () => {
  test.each([
    [false, false],
    [true, true],
    [undefined, undefined],
    ['lazy', 'lazy'],
    [{ component: false }, false],
    [{ component: true }, true],
    [{ component: undefined }, undefined],
    [{ component: 'lazy' }, 'lazy'],
  ] as const)('when given `%s` returns `%s`', (input, expected) => {
    const value = getPrefetchConfigValue(input, 'component')

    expect(value).toBe(expected)
  })
})
