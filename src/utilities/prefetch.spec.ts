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

  test.each([
    [undefined, false, true, true, false],
    [undefined, 'eager', 'lazy', true, 'eager'],
    [undefined, true, 'intent', false, 'intent'],
    [undefined, { components: false }, true, true, false],
    [undefined, undefined, 'lazy', true, 'lazy'],
    ['intent', 'eager', false, false, 'intent'],
    [true, false, undefined, undefined, DEFAULT_PREFETCH_STRATEGY],
  ] as const)('when given [`%s`, `%s`, `%s`, `%s`] returns `%s`', (linkPrefetch, viewPrefetch, routePrefetch, routerPrefetch, expected) => {
    const value = getPrefetchOption({
      linkPrefetch,
      viewPrefetch,
      routePrefetch,
      routerPrefetch,
    }, 'components')

    expect(value).toBe(expected)
  })

  test('a view config can split components and props', () => {
    const configs = {
      viewPrefetch: { components: 'eager', props: false },
      routePrefetch: true,
    } as const

    expect(getPrefetchOption(configs, 'components')).toBe('eager')
    expect(getPrefetchOption(configs, 'props')).toBe(false)
  })

  test('only components are prefetched by default', () => {
    expect(getPrefetchOption({}, 'components')).toBe(DEFAULT_PREFETCH_STRATEGY)
    expect(getPrefetchOption({}, 'props')).toBe(false)
    expect(getPrefetchOption({}, 'loaders')).toBe(false)
  })

  test('object configs control each kind independently', () => {
    const configs = {
      routerPrefetch: { components: false, props: 'eager', loaders: 'intent' },
    } as const

    expect(getPrefetchOption(configs, 'components')).toBe(false)
    expect(getPrefetchOption(configs, 'props')).toBe('eager')
    expect(getPrefetchOption(configs, 'loaders')).toBe('intent')
    expect(getPrefetchOption({ routerPrefetch: { props: 'eager' } }, 'loaders')).toBe(false)
    expect(getPrefetchOption({ routerPrefetch: { loaders: 'eager' } }, 'props')).toBe(false)
  })

  test('each kind inherits and overrides its own setting', () => {
    const configs = {
      routerPrefetch: { components: 'lazy', props: 'eager', loaders: 'intent' },
      routePrefetch: { props: false },
      viewPrefetch: { loaders: true },
      linkPrefetch: { components: false },
    } as const

    expect(getPrefetchOption(configs, 'components')).toBe(false)
    expect(getPrefetchOption(configs, 'props')).toBe(false)
    expect(getPrefetchOption(configs, 'loaders')).toBe('intent')
    expect(getPrefetchOption({ ...configs, linkPrefetch: { loaders: false } }, 'props')).toBe(false)
    expect(getPrefetchOption({ ...configs, linkPrefetch: { loaders: false } }, 'loaders')).toBe(false)
  })

  test.each(['components', 'props', 'loaders'] as const)('scalar configs apply to %s', (setting) => {
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
    [{ components: false }, false],
    [{ components: true }, true],
    [{ components: undefined }, undefined],
    [{ components: 'lazy' }, 'lazy'],
  ] as const)('when given `%s` returns `%s`', (input, expected) => {
    const value = getPrefetchConfigValue(input, 'components')

    expect(value).toBe(expected)
  })
})
