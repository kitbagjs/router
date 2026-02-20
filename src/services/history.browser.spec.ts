import { BrowserHistory, createBrowserHistory, createHashHistory, createMemoryHistory, HashHistory, MemoryHistory } from '@/services/history'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

describe('a browser history', () => {
  let history: BrowserHistory
  beforeEach(() => {
    // @ts-expect-error - copied test from history
    window.history.replaceState(null, null, '/')
    history = createBrowserHistory()
  })

  test('knows how to create hrefs from location objects', () => {
    const href = history.createHref({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash',
    })

    expect(href).toEqual('/the/path?the=query#the-hash')
  })

  test('knows how to create hrefs from strings', () => {
    const href = history.createHref('/the/path?the=query#the-hash')
    expect(href).toEqual('/the/path?the=query#the-hash')
  })

  test('does not encode the generated path', () => {
    const encodedHref = history.createHref({
      pathname: '/%23abc',
    })
    expect(encodedHref).toEqual('/%23abc')

    const unencodedHref = history.createHref({
      pathname: '/#abc',
    })
    expect(unencodedHref).toEqual('/#abc')
  })
})

describe('a hash history on a page with a <base> tag', () => {
  let history: HashHistory, base: HTMLBaseElement
  beforeEach(() => {
    if (window.location.hash !== '#/') {
      window.location.hash = '/'
    }

    base = document.createElement('base')
    base.setAttribute('href', '/prefix')

    document.head.appendChild(base)

    history = createHashHistory()
  })

  afterEach(() => {
    document.head.removeChild(base)
  })

  test('knows how to create hrefs', () => {
    const hashIndex = window.location.href.indexOf('#')
    const upToHash = hashIndex === -1 ? window.location.href : window.location.href.slice(0, hashIndex)

    const href = history.createHref({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash',
    })

    expect(href).toEqual(upToHash + '#/the/path?the=query#the-hash')
  })
})

describe('a hash history', () => {
  let history: HashHistory
  beforeEach(() => {
    window.history.replaceState(null, null as any as string, '#/') // FIXME: type
    history = createHashHistory()
  })

  test('knows how to create hrefs from location objects', () => {
    const href = history.createHref({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash',
    })

    expect(href).toEqual('#/the/path?the=query#the-hash')
  })

  test('knows how to create hrefs from strings', () => {
    const href = history.createHref('/the/path?the=query#the-hash')
    expect(href).toEqual('#/the/path?the=query#the-hash')
  })

  test('does not encode the generated path', () => {
    const encodedHref = history.createHref({
      pathname: '/%23abc',
    })
    expect(encodedHref).toEqual('#/%23abc')

    const unencodedHref = history.createHref({
      pathname: '/#abc',
    })
    expect(unencodedHref).toEqual('#/#abc')
  })
})

describe('a memory history', () => {
  let history: MemoryHistory
  beforeEach(() => {
    history = createMemoryHistory()
  })

  test('has an index property', () => {
    expect(typeof history.index).toBe('number')
  })

  test('knows how to create hrefs', () => {
    const href = history.createHref({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash',
    })

    expect(href).toEqual('/the/path?the=query#the-hash')
  })

  test('knows how to create hrefs from strings', () => {
    const href = history.createHref('/the/path?the=query#the-hash')
    expect(href).toEqual('/the/path?the=query#the-hash')
  })

  test('does not encode the generated path', () => {
    const encodedHref = history.createHref({
      pathname: '/%23abc',
    })
    expect(encodedHref).toEqual('/%23abc')

    const unencodedHref = history.createHref({
      pathname: '/#abc',
    })
    expect(unencodedHref).toEqual('/#abc')
  })
})
