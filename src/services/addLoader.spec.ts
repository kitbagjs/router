import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { LoaderNameConflict } from '@/errors/loaderNameConflict'
import { RouteLoaders } from '@/types/routeLoaders'
import { RouteViews } from '@/types/routeViews'
import { component } from '@/utilities/testHelpers'

const load = (): { foo: string } => ({ foo: 'bar' })
const other = (): { baz: number } => ({ baz: 1 })

function lastMatch(route: { matches: { loaders: RouteLoaders, views: RouteViews }[] }): { loaders: RouteLoaders, views: RouteViews } {
  return route.matches[route.matches.length - 1]
}

function pick(route: { matches: { loaders: RouteLoaders, views: RouteViews }[] }, key: 'load' | 'prefetch'): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(lastMatch(route).loaders)
      .filter(([, loader]) => loader[key] !== undefined)
      .map(([name, loader]) => [name, loader[key]]),
  )
}

describe('loaders', () => {
  test('a loader added without a name is stored under "default"', () => {
    const route = createRoute({ name: 'route' }).addLoader(load)

    expect(pick(route, 'load')).toStrictEqual({ default: load })
  })

  test('a named loader is stored under its name', () => {
    const route = createRoute({ name: 'route' }).addLoader(load, { name: 'posts' })

    expect(pick(route, 'load')).toStrictEqual({ posts: load })
  })

  test('multiple loaders accumulate in the same loaders entry', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(load)
      .addLoader(other, { name: 'posts' })

    expect(pick(route, 'load')).toStrictEqual({ default: load, posts: other })
  })

  test('a route starts with no loaders', () => {
    const route = createRoute({ name: 'route' })

    expect(lastMatch(route).loaders).toStrictEqual({})
  })

  test('adding a loader under a name the route already used overrides it', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(load, { name: 'posts' })
      .addLoader(other, { name: 'posts' })

    expect(pick(route, 'load')).toStrictEqual({ posts: other })
  })
})

describe('prefetch', () => {
  test('prefetch is stored under the loader name', () => {
    const route = createRoute({ name: 'route' }).addLoader(load, { prefetch: false })

    expect(pick(route, 'prefetch')).toStrictEqual({ default: false })
  })

  test('each loader keeps its own prefetch config', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(load, { prefetch: 'eager' })
      .addLoader(other, { name: 'posts', prefetch: false })

    expect(pick(route, 'prefetch')).toStrictEqual({ default: 'eager', posts: false })
  })

  test('loaders without a prefetch config are left absent', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(load)
      .addLoader(other, { name: 'posts', prefetch: 'intent' })

    expect(pick(route, 'prefetch')).toStrictEqual({ posts: 'intent' })
  })
})

describe('ancestor conflicts', () => {
  test('a loader with the same name as an ancestor throws', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(load)
    const child = createRoute({ parent, name: 'child', path: '/child' })

    expect(() => child.addLoader(other)).toThrow(LoaderNameConflict)
  })

  test('a named loader with the same name as an ancestor throws', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(load, { name: 'posts' })
    const child = createRoute({ parent, name: 'child', path: '/child' })

    expect(() => child.addLoader(other, { name: 'posts' })).toThrow(LoaderNameConflict)
  })

  test('a loader with a name no ancestor uses is added', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' }).addLoader(load)
    const child = createRoute({ parent, name: 'child', path: '/child' }).addLoader(other, { name: 'posts' })

    expect(pick(child, 'load')).toStrictEqual({ posts: other })
    expect(child.matches[0].loaders).toStrictEqual({ default: { load, prefetch: undefined } })
  })
})

describe('immutability + chaining', () => {
  test('addLoader returns a new route without mutating the original', () => {
    const route = createRoute({ name: 'route' })
    const withLoader = route.addLoader(load)

    expect(withLoader).not.toBe(route)
    expect(pick(route, 'load')).toStrictEqual({})
    expect(pick(withLoader, 'load')).toStrictEqual({ default: load })
  })

  test('adding a view after a loader keeps both', () => {
    const route = createRoute({ name: 'route' })
      .addLoader(load)
      .addView(component)

    expect(pick(route, 'load')).toStrictEqual({ default: load })
    expect(lastMatch(route).views.default.component).toBe(component)
  })

  test('adding a loader after a view keeps both', () => {
    const route = createRoute({ name: 'route' })
      .addView(component)
      .addLoader(load)

    expect(pick(route, 'load')).toStrictEqual({ default: load })
    expect(lastMatch(route).views.default.component).toBe(component)
  })

  test('addLoader on a child returns the merged route with its ancestors', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' })
    const child = createRoute({ name: 'child', parent, path: '/child' })

    const withLoader = child.addLoader(load)

    expect(withLoader.name).toBe('child')
    expect(withLoader.matches).toHaveLength(2)
    expect(pick(withLoader, 'load')).toStrictEqual({ default: load })
  })
})
