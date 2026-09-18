import { describe, expectTypeOf, test } from 'vitest'
import { createRoute } from './createRoute'
import { withParams } from './withParams'
import { ResolvedRoute } from '@/types/resolved'
import { component } from '@/utilities/testHelpers'

describe('addAlias', () => {
  test('a transform can be omitted when the alias params satisfy the route params', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: String }) })

    user.addAlias('/member/[id]')
  })

  test('a transform is required when the alias renames a param', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: String }) })

    // @ts-expect-error an alias whose params do not satisfy the route's requires a transform
    user.addAlias('/profile/[username]')
  })

  test('a transform is required when the alias types a param differently', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: String }) })

    // @ts-expect-error a number alias param does not satisfy a string route param
    user.addAlias(withParams('/u/[id]', { id: Number }))
  })

  test('a transform is required when the alias makes a required param optional', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })

    // @ts-expect-error an optional alias param does not satisfy a required route param
    user.addAlias('/member/[?id]')
  })

  test('a transform is required when the alias has no params and the route does', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })

    // @ts-expect-error an alias without params cannot supply the route param without a transform
    user.addAlias('/me')
  })

  test('the transform receives the alias params typed by the alias pattern', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: String }) })

    user.addAlias(withParams('/u/[num]', { num: Number }), ({ url, params }) => {
      expectTypeOf(url).toEqualTypeOf<string>()
      expectTypeOf(params).toEqualTypeOf<{ num: number }>()

      return { id: String(params.num) }
    })
  })

  test('the transform must return the route params', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: String }) })

    // @ts-expect-error the transform must return the route's params, not the alias's
    user.addAlias(withParams('/u/[num]', { num: Number }), ({ params }) => ({ num: params.num }))
  })

  test('the transform can supply a param the alias does not carry', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })

    user.addAlias('/me', () => ({ id: 'current' }))
  })

  test('the transform returns query params the route declares too', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[?tab]' })

    user.addAlias('/me', () => ({ id: 'current' }))
    user.addAlias('/me', ({ params }) => ({ id: 'current', tab: params.tab }))
  })

  test('a nested alias only has to satisfy the params of its own segment', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]' })

    post.addAlias('/p/[postId]')
  })

  test('a nested transform returns only the params of its own segment', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]' })

    post.addAlias('/p/[slug]', ({ params }) => {
      expectTypeOf(params).toEqualTypeOf<{ slug: string }>()

      return { postId: params.slug }
    })
  })

  test('an alias leaves the route type unchanged', () => {
    const route = createRoute({ name: 'user', path: '/user/[id]' }).addView(component)
    const aliased = route.addAlias('/member/[id]')

    expectTypeOf(aliased).toEqualTypeOf(route)
  })

  test('an alias can be chained with views and loaders', () => {
    const route = createRoute({ name: 'user', path: '/user/[id]' })
      .addAlias('/member/[id]')
      .addLoader(() => 'kitbag')
      .addView(component)

    expectTypeOf<ResolvedRoute<typeof route>['params']>().toEqualTypeOf<{ id: string }>()
  })
})
