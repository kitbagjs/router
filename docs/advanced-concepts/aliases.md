# Aliases

An alias is an additional url a route matches. When a user visits an alias url, the route resolves exactly as it would for its own url and the address bar keeps the alias. That is what separates an alias from a [redirect](/advanced-concepts/redirects), which replaces the url.

Aliases are added to a route with the chainable `addAlias` method.

```ts
import { createRoute } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: '/user/[id]',
}).addAlias({ path: '/member/[id]' })
```

:white_check_mark: `/user/42`  
:white_check_mark: `/member/42`  

Both urls resolve to `user` with `params.id` of `"42"`.

## Params

An alias is typed the same way a route url is. It can declare its own params with their own names and types using [withParams](/core-concepts/params). When the alias params already satisfy the route params, matched values pass straight through and nothing else is needed.

When they do not, the alias needs a `transform`. The transform receives the url that matched and the alias params, and returns the route params.

```ts
import { createRoute, withParams } from '@kitbag/router'

const user = createRoute({
  name: 'user',
  path: withParams('/user/[id]', { id: String }),
})
  // the alias renames and retypes the param, the transform converts it
  .addAlias({ path: withParams('/u/[num]', { num: Number }) }, ({ params }) => ({ id: String(params.num) }))
  // the alias has no params at all, the transform supplies the route's
  .addAlias({ path: '/me' }, () => ({ id: session.currentUserId }))
```

## Query and Hash

An alias declares its whole url with the same `path`, `query`, and `hash` options `createRoute` takes. Nothing is inherited from the route: an alias without a `query` matches without one, and any query or hash param the route declares is then the transform's to supply. Because the alias's params are its own, a param can live in a different part of the url than it does on the route.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
  query: 'tab=[tab]',
})
  // the route's id moves into the query, its tab is supplied
  .addAlias({ path: '/member', query: 'id=[id]' }, ({ params }) => ({ id: params.id, tab: 'posts' }))
  // the query param is renamed and a hash is required
  .addAlias({ path: '/member/[id]', query: 'view=[view]', hash: 'profile' }, ({ params }) => ({ id: params.id, tab: params.view }))
```

:white_check_mark: `/member?id=42`  
:white_check_mark: `/member/42?view=posts#profile`  
:x: `/member/42?view=posts`  

## Nested Routes

An alias stands in for the route it is added to, not for its parents. A child route is matched under every url its parent has, its own or an alias, combined with every url of its own.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
}).addAlias({ path: '/member/[id]' })

const post = createRoute({
  parent: user,
  name: 'post',
  path: '/posts/[postId]',
}).addAlias({ path: '/p/[postId]' })
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

Updating a param with `route.update` or by assigning to `route.params` navigates by route name as well, so it lands on the route's own url. A transform only runs one way, so the router cannot know how a new value should appear in the alias. To stay on an alias after changing a param, push the alias url yourself.

```ts
// at /member/42
route.update('id', '7') // navigates to /user/7
router.push('/member/7') // stays on the alias
```

## Matching Order

Every route's own url is tried before any alias, regardless of the order routes were defined in. An alias can never take a url away from a route whose own url matches it. See [route matching](/advanced-concepts/route-matching#aliases).
