import { describe, expect, test, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createRoute } from '@/services/createRoute'
import { getMatchForUrl } from '@/services/getMatchesForUrl'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { component } from '@/utilities/testHelpers'

describe('matching', () => {
  test('an alias url resolves to the route', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })

    const match = getMatchForUrl([user], '/member/42')

    expect(match?.name).toBe('user')
    expect(match?.params).toEqual({ id: '42' })
  })

  test('href is the alias url and canonical is the route url', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })

    const match = getMatchForUrl([user], '/member/42')

    expect(match?.href).toBe('/member/42')
    expect(match?.canonical).toBe('/user/42')
  })

  test('href and canonical are the same when the route url matched', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })

    const match = getMatchForUrl([user], '/user/42')

    expect(match?.href).toBe('/user/42')
    expect(match?.canonical).toBe('/user/42')
  })

  test('a route can have several aliases', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: '/member/[id]' })
      .addAlias({ path: '/people/[id]' })

    expect(getMatchForUrl([user], '/member/42')?.name).toBe('user')
    expect(getMatchForUrl([user], '/people/42')?.name).toBe('user')
  })

  test('an alias without a transform passes its params straight through', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: Number }), component })
      .addAlias({ path: withParams('/member/[id]', { id: Number }) })

    const match = getMatchForUrl([user], '/member/42')

    expect(match?.params).toEqual({ id: 42 })
  })

  test('a transform maps the alias params into the route params', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: '/profile/[username]' }, ({ params }) => ({ id: params.username.toUpperCase() }))

    const match = getMatchForUrl([user], '/profile/kitbag')

    expect(match?.params).toEqual({ id: 'KITBAG' })
    expect(match?.canonical).toBe('/user/KITBAG')
  })

  test('a transform receives the url that matched and the alias params', () => {
    const transform = vi.fn(() => ({ id: 'current' }))
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: '/member/[slug]' }, transform)

    getMatchForUrl([user], '/member/kitbag?tab=posts')

    expect(transform).toHaveBeenCalledWith({ url: '/member/kitbag?tab=posts', params: { slug: 'kitbag' } })
  })

  test('a transform can supply a param the alias does not carry', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: '/me' }, () => ({ id: 'current' }))

    const match = getMatchForUrl([user], '/me')

    expect(match?.params).toEqual({ id: 'current' })
    expect(match?.href).toBe('/me')
    expect(match?.canonical).toBe('/user/current')
  })

  test('the same param name can have a different type on each side', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: withParams('/u/[id]', { id: Number }) }, ({ params }) => ({ id: `user-${params.id + 1}` }))

    const match = getMatchForUrl([user], '/u/41')

    expect(match?.params).toEqual({ id: 'user-42' })
  })

  test('an alias whose own params fail parsing does not match', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: withParams('/u/[id]', { id: Number }) }, ({ params }) => ({ id: String(params.id) }))

    const match = getMatchForUrl([user], '/u/kitbag')

    expect(match).toBeUndefined()
  })

  test('transformed params the route cannot serialize do not match', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: Number }), component })
      .addAlias({ path: '/profile/[username]' }, ({ params }) => ({ id: Number(params.username) }))

    const match = getMatchForUrl([user], '/profile/kitbag')

    expect(match).toBeUndefined()
  })

  test('transformed params are parsed the same as the route url would be', () => {
    const user = createRoute({ name: 'user', path: withParams('/user/[id]', { id: Number }), component })
      .addAlias({ path: '/profile/[username]' }, ({ params }) => ({ id: params.username.length }))

    const match = getMatchForUrl([user], '/profile/kitbag')

    expect(match?.params).toEqual({ id: 6 })
    expect(match?.canonical).toBe('/user/6')
  })

  test('an alias keeps the query the route declares', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[tab]', component }).addAlias({ path: '/member/[id]' })

    expect(getMatchForUrl([user], '/member/42')).toBeUndefined()
    expect(getMatchForUrl([user], '/member/42?tab=posts')?.params).toEqual({ id: '42', tab: 'posts' })
  })

  test('an alias keeps query values the route does not declare', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[?tab]', component }).addAlias({ path: '/member/[id]' })

    const match = getMatchForUrl([user], '/member/42?tab=posts&extra=1')

    expect(match?.query.toString()).toBe('tab=posts&extra=1')
    expect(match?.href).toBe('/member/42?tab=posts&extra=1')
    expect(match?.canonical).toBe('/user/42?tab=posts&extra=1')
  })

  test('an alias keeps the hash', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })

    const match = getMatchForUrl([user], '/member/42#bio')

    expect(match?.hash).toBe('#bio')
    expect(match?.href).toBe('/member/42#bio')
  })

  test('an alias on an unnamed route is not matched', () => {
    const route = createRoute({ path: '/route', component }).addAlias({ path: '/alias' })

    expect(getMatchForUrl([route], '/alias')).toBeUndefined()
  })
})

describe('parts', () => {
  test('an alias with only a path keeps the route query and hash', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[tab]', hash: 'bio', component })
      .addAlias({ path: '/member/[id]' })

    expect(getMatchForUrl([user], '/member/42?tab=posts#bio')?.params).toEqual({ id: '42', tab: 'posts' })
    expect(getMatchForUrl([user], '/member/42#bio')).toBeUndefined()
  })

  test('an alias can declare its own query', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[tab]', component })
      .addAlias({ path: '/member/[id]', query: 'view=[view]' }, ({ params }) => ({ id: params.id, tab: params.view }))

    const match = getMatchForUrl([user], '/member/42?view=posts')

    expect(match?.params).toEqual({ id: '42', tab: 'posts' })
    expect(match?.href).toBe('/member/42?view=posts')
    expect(match?.canonical).toBe('/user/42?tab=posts')
  })

  test('an alias query param is consumed rather than carried into canonical', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component })
      .addAlias({ path: '/member/[id]', query: 'legacy=[legacy]' }, ({ params }) => ({ id: params.legacy }))

    const match = getMatchForUrl([user], '/member/1?legacy=42&extra=1')

    expect(match?.params).toEqual({ id: '42' })
    expect(match?.query.toString()).toBe('legacy=42&extra=1')
    expect(match?.canonical).toBe('/user/42?extra=1')
  })

  test('an alias can declare its own hash', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', hash: 'bio', component })
      .addAlias({ hash: 'about' })

    const match = getMatchForUrl([user], '/user/42#about')

    expect(match?.name).toBe('user')
    expect(match?.href).toBe('/user/42#about')
  })

  test('an alias without a path keeps the route path', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', query: 'tab=[tab]', component })
      .addAlias({ query: 'view=[tab]' })

    const match = getMatchForUrl([user], '/user/42?view=posts')

    expect(match?.params).toEqual({ id: '42', tab: 'posts' })
    expect(match?.canonical).toBe('/user/42?tab=posts')
  })

  test('an alias with its own query composes with a parent alias', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/member/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', query: 'tab=[tab]', component })
      .addAlias({ path: '/p/[postId]', query: 'view=[view]' }, ({ params }) => ({ postId: params.postId, tab: params.view }))

    const match = getMatchForUrl([post, user], '/member/1/p/2?view=comments')

    expect(match?.params).toEqual({ id: '1', postId: '2', tab: 'comments' })
    expect(match?.canonical).toBe('/user/1/posts/2?tab=comments')
  })
})

describe('precedence', () => {
  test('a route url beats an alias defined on an earlier route', () => {
    const first = createRoute({ name: 'first', path: '/first/[id]', component }).addAlias({ path: '/second/[id]' })
    const second = createRoute({ name: 'second', path: '/second/[id]', component })

    const match = getMatchForUrl([first, second], '/second/42')

    expect(match?.name).toBe('second')
  })

  test('a route url beats an alias defined on a deeper route', () => {
    const parent = createRoute({ name: 'parent', path: '/parent', component })
    const child = createRoute({ parent, name: 'child', path: '/child', component }).addAlias({ path: '/other' })
    const other = createRoute({ name: 'other', path: '/other', component })

    const match = getMatchForUrl([child, parent, other], '/other')

    expect(match?.name).toBe('other')
  })

  test('the first alias in route order wins between aliases', () => {
    const first = createRoute({ name: 'first', path: '/first', component }).addAlias({ path: '/shared' })
    const second = createRoute({ name: 'second', path: '/second', component }).addAlias({ path: '/shared' })

    const match = getMatchForUrl([first, second], '/shared')

    expect(match?.name).toBe('first')
  })
})

describe('nesting', () => {
  test('a child matches through its parent alias', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/member/[id]' })
    const posts = createRoute({ parent: user, name: 'posts', path: '/posts', component })

    const match = getMatchForUrl([posts, user], '/member/42/posts')

    expect(match?.name).toBe('posts')
    expect(match?.params).toEqual({ id: '42' })
    expect(match?.canonical).toBe('/user/42/posts')
  })

  test('a parent alias transform maps its own segment', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/me' }, () => ({ id: 'current' }))
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', component })

    const match = getMatchForUrl([post, user], '/me/posts/7')

    expect(match?.params).toEqual({ id: 'current', postId: '7' })
    expect(match?.canonical).toBe('/user/current/posts/7')
  })

  test('a child alias replaces only its own segment', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', component })
      .addAlias({ path: '/p/[slug]' }, ({ params }) => ({ postId: params.slug.toUpperCase() }))

    const match = getMatchForUrl([post, user], '/user/42/p/kitbag')

    expect(match?.params).toEqual({ id: '42', postId: 'KITBAG' })
    expect(match?.canonical).toBe('/user/42/posts/KITBAG')
  })

  test('parent and child aliases compose', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: withParams('/u/[num]', { num: Number }) }, ({ params }) => ({ id: String(params.num) }))
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', component }).addAlias({ path: '/p/[postId]' })

    const match = getMatchForUrl([post, user], '/u/42/p/7')

    expect(match?.name).toBe('post')
    expect(match?.params).toEqual({ id: '42', postId: '7' })
    expect(match?.href).toBe('/u/42/p/7')
    expect(match?.canonical).toBe('/user/42/posts/7')
  })

  test('every combination of parent and child urls resolves', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/member/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', component }).addAlias({ path: '/p/[postId]' })
    const routes = [post, user]

    expect(getMatchForUrl(routes, '/user/1/posts/2')?.canonical).toBe('/user/1/posts/2')
    expect(getMatchForUrl(routes, '/user/1/p/2')?.canonical).toBe('/user/1/posts/2')
    expect(getMatchForUrl(routes, '/member/1/posts/2')?.canonical).toBe('/user/1/posts/2')
    expect(getMatchForUrl(routes, '/member/1/p/2')?.canonical).toBe('/user/1/posts/2')
  })

  test('aliases compose through more than one level', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/member/[id]' })
    const posts = createRoute({ parent: user, name: 'posts', path: '/posts' }).addAlias({ path: '/p' })
    const post = createRoute({ parent: posts, name: 'post', path: '/[postId]', component })

    const match = getMatchForUrl([post, posts, user], '/member/1/p/2')

    expect(match?.name).toBe('post')
    expect(match?.canonical).toBe('/user/1/posts/2')
  })

  test('a hoisted child does not compose with its parent aliases', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' }).addAlias({ path: '/member/[id]' })
    const settings = createRoute({ parent: user, name: 'settings', path: '/settings', hoist: true, component }).addAlias({ path: '/preferences' })

    const routes = [settings, user]

    expect(getMatchForUrl(routes, '/preferences')?.name).toBe('settings')
    expect(getMatchForUrl(routes, '/member/1/preferences')).toBeUndefined()
  })

  test('an alias param that collides with a parent param throws DuplicateParamsError', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]' })
    const post = createRoute({ parent: user, name: 'post', path: '/posts/[postId]', component })

    expect(() => post.addAlias({ path: '/p/[id]' }, ({ params }) => ({ postId: params.id }))).toThrow(DuplicateParamsError)
  })
})

describe('router', () => {
  test('navigating to an alias url keeps the alias in the address bar', async () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/member/42' })

    await router.start()

    expect(router.route.name).toBe('user')
    expect(router.route.href).toBe('/member/42')
    expect(router.route.canonical).toBe('/user/42')
  })

  test('re-pushing the current route from an alias stays on the alias', async () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/member/42' })

    await router.start()
    await router.push(router.route)

    expect(router.route.href).toBe('/member/42')
  })

  test('updating the query from an alias stays on the alias', async () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/member/42' })

    await router.start()

    router.route.query.set('tab', 'posts')

    await flushPromises()

    expect(router.route.href).toBe('/member/42?tab=posts')
  })

  test('pushing a route by name targets its own url', async () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/member/42' })

    await router.start()
    await router.push('user', { id: '7' })

    expect(router.route.href).toBe('/user/7')
  })

  test('resolving a route by name never produces an alias url', () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/member/42' })

    const resolved = router.resolve('user', { id: '7' })

    expect(resolved.href).toBe('/user/7')
    expect(resolved.canonical).toBe('/user/7')
  })

  test('the router base applies to alias urls', async () => {
    const user = createRoute({ name: 'user', path: '/user/[id]', component }).addAlias({ path: '/member/[id]' })
    const router = createRouter([user], { initialUrl: '/kitbag/member/42', base: '/kitbag' })

    await router.start()

    expect(router.route.name).toBe('user')
    expect(router.route.href).toBe('/kitbag/member/42')
    expect(router.route.canonical).toBe('/kitbag/user/42')
  })
})
