import { describe, expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { RouteViews } from '@/types/routeViews'
import { component } from '@/utilities/testHelpers'

const other = { template: '<div>other</div>' }

function lastView(route: { matches: { views: RouteViews }[] }): RouteViews {
  return route.matches[route.matches.length - 1].views
}

function pick(route: { matches: { views: RouteViews }[] }, key: 'component' | 'props' | 'prefetch'): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(lastView(route))
      .filter(([, view]) => view[key] !== undefined)
      .map(([name, view]) => [name, view[key]]),
  )
}

describe('components', () => {
  test('a default view is stored under "default"', () => {
    const route = createRoute({ name: 'route' }).addView(component)

    expect(pick(route, 'component')).toStrictEqual({ default: component })
  })

  test('a named view is stored under its name', () => {
    const route = createRoute({ name: 'route' }).addView(component, {
      name: 'sidebar',
    })

    expect(pick(route, 'component')).toStrictEqual({ sidebar: component })
  })

  test('multiple views accumulate in the same views entry', () => {
    const route = createRoute({ name: 'route' })
      .addView(component)
      .addView(other, {
        name: 'sidebar',
      })

    expect(pick(route, 'component')).toStrictEqual({ default: component, sidebar: other })
  })
})

describe('props', () => {
  test('a lone default view getter is stored as bare props', () => {
    const getter = (): { foo: string } => ({ foo: 'bar' })
    const route = createRoute({ name: 'route' }).addView(component, {
      props: getter,
    })

    expect(pick(route, 'props')).toStrictEqual({ default: getter })
  })

  test('an omitted getter leaves props untouched', () => {
    const route = createRoute({ name: 'route' }).addView(component)

    expect(pick(route, 'props')).toStrictEqual({})
  })

  test('adding a named getter promotes to a record, pulling the bare default under "default"', () => {
    const defaultGetter = (): { foo: string } => ({ foo: 'bar' })
    const sidebarGetter = (): { baz: number } => ({ baz: 1 })

    const route = createRoute({ name: 'route' })
      .addView(component, {
        props: defaultGetter,
      })
      .addView(other, {
        name: 'sidebar',
        props: sidebarGetter,
      })

    expect(pick(route, 'props')).toStrictEqual({ default: defaultGetter, sidebar: sidebarGetter })
  })
})

describe('prefetch', () => {
  test('prefetch is stored under the view name', () => {
    const route = createRoute({ name: 'route' }).addView(component, {
      prefetch: false,
    })

    expect(pick(route, 'prefetch')).toStrictEqual({ default: false })
    expect(pick(route, 'props')).toStrictEqual({})
  })

  test('prefetch is stored alongside a props getter', () => {
    const getter = (): { foo: string } => ({ foo: 'bar' })
    const route = createRoute({ name: 'route' }).addView(component, {
      props: getter,
      prefetch: 'eager',
    })

    expect(pick(route, 'props')).toStrictEqual({ default: getter })
    expect(pick(route, 'prefetch')).toStrictEqual({ default: 'eager' })
  })

  test('prefetch is stored under a named view name', () => {
    const route = createRoute({ name: 'route' }).addView(component, {
      name: 'sidebar',
      prefetch: 'eager',
    })

    expect(pick(route, 'prefetch')).toStrictEqual({ sidebar: 'eager' })
  })

  test('prefetch is stored alongside a named view props getter', () => {
    const getter = (): { foo: string } => ({ foo: 'bar' })
    const route = createRoute({ name: 'route' }).addView(component, {
      name: 'sidebar',
      props: getter,
      prefetch: 'intent',
    })

    expect(pick(route, 'props')).toStrictEqual({ sidebar: getter })
    expect(pick(route, 'prefetch')).toStrictEqual({ sidebar: 'intent' })
  })

  test('each view keeps its own prefetch config', () => {
    const route = createRoute({ name: 'route' })
      .addView(component, {
        prefetch: { components: 'eager', props: false },
      })
      .addView(other, {
        name: 'sidebar',
        prefetch: false,
      })

    expect(pick(route, 'prefetch')).toStrictEqual({
      default: { components: 'eager', props: false },
      sidebar: false,
    })
  })

  test('views without a prefetch config are left absent', () => {
    const route = createRoute({ name: 'route' })
      .addView(component)
      .addView(other, {
        name: 'sidebar',
        prefetch: 'intent',
      })

    expect(pick(route, 'prefetch')).toStrictEqual({ sidebar: 'intent' })
  })
})

describe('backwards compatibility', () => {
  test('addView merges with the deprecated component and props options', () => {
    const defaultGetter = (): { foo: string } => ({ foo: 'bar' })
    const sidebarGetter = (): { baz: number } => ({ baz: 1 })

    const route = createRoute({ name: 'route', component }, defaultGetter)
      .addView(other, {
        name: 'sidebar',
        props: sidebarGetter,
      })

    expect(pick(route, 'component')).toStrictEqual({ default: component, sidebar: other })
    expect(pick(route, 'props')).toStrictEqual({ default: defaultGetter, sidebar: sidebarGetter })
  })
})

describe('immutability + chaining', () => {
  test('addView returns a new route without mutating the original', () => {
    const route = createRoute({ name: 'route' })
    const withView = route.addView(component)

    expect(withView).not.toBe(route)
    expect(pick(route, 'component')).toStrictEqual({})
    expect(pick(withView, 'component')).toStrictEqual({ default: component })
  })

  test('addView on a child returns the merged route with a combined views tuple', () => {
    const parent = createRoute({ name: 'parent', path: '/parent' })
    const child = createRoute({ name: 'child', parent, path: '/child' })

    const withView = child.addView(component)

    expect(withView.name).toBe('child')
    expect(withView.matches).toHaveLength(2)
    expect(pick(withView, 'component')).toStrictEqual({ default: component })
    expect(withView.matched).toBe(withView.matches.at(-1))
  })
})
