# Aliases

An alias is an additional path a route matches. When a user visits an alias url, the route resolves exactly as it would for its own path and the address bar keeps the alias. That is what separates an alias from a [redirect](/advanced-concepts/redirects), which replaces the url.

Aliases are added to a route with the chainable `addAlias` method.

```ts
import { createRoute } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: '/user/[id]',
}).addAlias('/member/[id]')
```

:white_check_mark: `/user/42`  
:white_check_mark: `/member/42`  

Both urls resolve to `user` with `params.id` of `"42"`.

## Params

An alias pattern is a path pattern, typed the same way a route path is. It can declare its own params with their own names and types using [withParams](/core-concepts/params). When the alias params already satisfy the route params, matched values pass straight through and nothing else is needed.

When they do not, the alias needs a `transform`. The transform receives the url that matched and the alias params, and returns the route params.

```ts
import { createRoute, withParams } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: withParams('/user/[id]', { id: String }),
})
  // the alias renames and retypes the param, the transform converts it
  .addAlias(withParams('/u/[num]', { num: Number }), ({ params }) => ({ id: String(params.num) }))
  // the alias has no params at all, the transform supplies the route's
  .addAlias('/me', () => ({ id: session.currentUserId }))
```

Whether a transform is required is checked when the alias is declared, so a shape mismatch is a type error rather than a param that is silently `undefined` at runtime.

```ts
// ❌ Error: '/profile/[username]' does not declare an 'id' param, so a transform is required
user.addAlias('/profile/[username]')
```

The transform runs synchronously while the router matches the url. What it returns is written into the route's own url and parsed back out of it, the same as navigating to the route by name. If the route cannot serialize a returned value, for example a required param that is missing, the alias does not match.

::: tip
An alias is a path pattern only. The route's `query` and `hash` apply to the alias unchanged, so a transform returns any query params the route declares as well.
:::

## Nested Routes

An alias replaces the path of the route it is added to, not the paths of its parents. A child route is matched under every path its parent has, its own or an alias, combined with every path of its own.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
}).addAlias('/member/[id]')

const post = createRoute({
  parent: user,
  name: 'post',
  path: '/posts/[postId]',
}).addAlias('/p/[postId]')
```

:white_check_mark: `/user/1/posts/2`  
:white_check_mark: `/user/1/p/2`  
:white_check_mark: `/member/1/posts/2`  
:white_check_mark: `/member/1/p/2`  

Each level's transform only maps the params of its own segment. A transform on `user` returns `id`, a transform on `post` returns `postId`.

## Href and Canonical

When a route is matched through an alias, the resolved route's `href` is the alias url the user visited. The route's own url is available as `canonical`.

```ts
// at /member/42
router.route.href // '/member/42'
router.route.canonical // '/user/42'
```

Pushing a resolved route pushes its `href`, so pushing the current route or updating its query while on an alias stays on the alias. Aliases are only ever matched, never generated: navigating by route name, resolving a route, and rendering a [router-link](/components/router-link) always produce the route's own url.

## Matching Order

Every route's own path is tried before any alias, regardless of the order routes were defined in. An alias can never take a url away from a route whose own path matches it. See [route matching](/advanced-concepts/route-matching#aliases).
