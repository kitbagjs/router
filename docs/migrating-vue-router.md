# Migrating from Vue Router

Kitbag Router covers many of the same routing needs as Vue Router, with some differences in built-in features. The comparison below focuses on capabilities; the sections that follow explain how to migrate. See the [Quick Start](/quick-start) for installation and TypeScript setup.

## Feature Parity

### Available in Both

- **Nested routes and named views** for composing page layouts.
- **Dynamic URL params**, including optional params, regex validation, and matching multiple path segments.
- **Named routes, redirects, and aliases**.
- **Programmatic navigation and links with active states**.
- **Navigation guards** for controlling access and responding to route changes.
- **Route metadata and component props binding**.
- **Browser, hash, and memory history**, including support for server rendering.
- **Lazy-loaded components and Vue transitions**.
- **Typed navigation and route data loading.** Vue Router provides [typed routes](https://router.vuejs.org/guide/advanced/typed-routes.html) and [data loaders](https://router.vuejs.org/data-loaders/); Kitbag provides [inferred route types](/core-concepts/type-safety) and [loaders](/core-concepts/loaders). Their setup and behavior differ.

### Available in Vue Router, Missing in Kitbag

- **Runtime route registration.** Vue Router can [add and remove routes while the app is running](https://router.vuejs.org/guide/advanced/dynamic-routing.html). Kitbag's routes are defined when creating the router.
- **Custom scroll behavior and restoration.** Vue Router provides [navigation-aware scroll handling](https://router.vuejs.org/guide/advanced/scroll-behavior.html). Kitbag applications need to manage scrolling separately.
- **File-based routing.** Vue Router provides a [plugin that generates routes from page files](https://router.vuejs.org/file-based-routing/). Kitbag has no built-in equivalent.

### Built Into Kitbag, Without a Direct Vue Router Equivalent

These are router-provided features in Kitbag. Similar behavior in Vue Router may require application code or additional integrations.

- **Typed rejection views.** Register responses such as unauthorized or not found with their own views and HTTP status codes. See [Rejections](/advanced-concepts/rejections).
- **Async component props.** Load data in a view's props getter, with the returned values checked against the component's required props. See [Component Props](/core-concepts/component-props).
- **Automatic link-driven prefetching.** Prefetch components, props, and loaders when links become visible or users hover or focus them. See [Prefetching](/advanced-concepts/prefetching).
- **Typed external routes.** Define external destinations with typed params and navigate to them through the router. See [External Routes](/core-concepts/external-routes).
- **Typed, reactive history state.** Define state fields and defaults on routes, then read and update them through the current route. See [Route State](/advanced-concepts/route-state).
- **Route title management.** Define titles on routes and compose them with parent titles. See [Title](/core-concepts/routes#title).

## Route Configuration

Create routes individually, attach their views with `addView`, and pass the routes to `createRouter`. Routes need a name to be navigable. See [Routes](/core-concepts/routes) and [Router](/core-concepts/router).

```ts
import { createRoute, createRouter } from '@kitbag/router'
import UserView from './UserView.vue'

const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
  .addView(UserView, {
    props: (route) => ({ userId: route.params.id }),
  })

export const router = createRouter([user], {
  historyMode: 'browser',
})
```

## Child Routes

Replace Vue Router's `children` array with a `parent` reference. Include the child in the routes passed to `createRouter`.

Kitbag concatenates parent and child paths literally. A leading `/` on the child does not make it an absolute path: `/users` + `/[id]` becomes `/users/[id]`. Without the slash, `/users` + `[id]` becomes `/users[id]`.

```ts
const users = createRoute({
  name: 'users',
  path: '/users',
})

const user = createRoute({
  parent: users,
  name: 'user',
  path: '/[id]',
})

const router = createRouter([users, user])
```

Use [`hoist: true`](/core-concepts/routes#hoisting) when a child should keep its component nesting but have an independent URL.

A named route's final path must start with `/`. Otherwise the router throws an `UnreachableRouteError`.

## Props Binding

Replace `props: true` with an explicit props getter in `addView`. Kitbag checks the returned props against the component's props, and requires a getter when the component has required props.

```ts
const user = createRoute({
  name: 'user',
  path: '/users/[id]',
})
  .addView(UserView, {
    props: (route) => ({ userId: route.params.id }),
  })
```

For Vue Router's `components` option, call `addView` for each component and pass a `name` for each named view. See [Component Props](/core-concepts/component-props) and [Named Views](/core-concepts/routes#named-views).

## Navigation

Pass the route name and params as separate arguments instead of a Vue Router location object. Using the `user` route above:

```ts
router.push('user', { id: '123' })
router.replace('user', { id: '456' })
```

For `RouterLink`, use its resolver callback to build a typed destination.

```vue
<RouterLink :to="(resolve) => resolve('user', { id: '123' })">
  View user
</RouterLink>
```

See [Navigation](/core-concepts/navigation) and [RouterLink](/components/router-link).

## Reading the Current Route

Import `useRoute` from `@kitbag/router`. You can pass a route name to narrow its type; this throws if the current route does not match that name.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute('user')
```

Some current-route properties differ from Vue Router:

| Vue Router | Kitbag Router |
| --- | --- |
| `route.query.page` | `route.query.get('page')` (`query` is a `URLSearchParams`) |
| `route.matched` | `route.matches` for the matched route and its parents |
| `route.hash` includes `#` | `route.hash` excludes `#` |

Query params declared in the route definition are also available in `route.params`, with their declared types. See [Query Params](/core-concepts/params#query-params), [Router Route](/core-concepts/router-route), and [useRoute](/composables/useRoute).

## Navigation Guards

Kitbag hooks receive `(to, context)`. Read the previous route from `context.from`, and use `context.abort()` to cancel navigation or `context.replace()` to redirect. Do not use Vue Router's `next` callback or return a location object to redirect.

This route hook redirects requests for `/old` to `/new`:

```ts
const oldRoute = createRoute({
  name: 'old',
  path: '/old',
})
  .onBeforeRouteEnter((to, context) => {
    context.replace('/new')
  })
```

Use `onBeforeRouteEnter`, `onBeforeRouteUpdate`, and `onBeforeRouteLeave` for the corresponding lifecycle events. Hooks can be registered on routes, on the router, or in components. See [Hooks](/advanced-concepts/hooks) for lifecycle details and [Context](/core-concepts/routes#context) for navigating to other named routes from route callbacks.

## Route Regex

Use `withParams` to validate a param with a regular expression instead of putting the expression in the path string. The route only matches when the param passes validation.

```ts
import { createRoute, withParams } from '@kitbag/router'

const archive = createRoute({
  name: 'archive',
  path: withParams('/archive/[date]', {
    date: /^\d{2}-\d{2}-\d{4}$/,
  }),
})
```

See [Param Types](/core-concepts/params#param-types). Use a greedy param when the value must span multiple path segments.

## Repeatable Params

Kitbag Router params match a single path segment by default. Use a [greedy param](/core-concepts/params#greedy-params) to match multiple segments, and `arrayOf` with a `/` separator to read them as an array.

```ts
import { arrayOf, createRoute, withParams } from '@kitbag/router'

const chapters = createRoute({
  name: 'chapters',
  path: withParams('/[chapters*]', {
    chapters: arrayOf([String], { separator: '/' }),
  }),
})
```

This matches `/one`, `/one/two`, and `/one/two/three`. For `/one/two`, `params.chapters` is `['one', 'two']`.

To also match `/`, make the param optional. Use `withDefault` if you want a missing value to be an empty array rather than `undefined`.

```ts
import { arrayOf, createRoute, withDefault, withParams } from '@kitbag/router'

const chapters = createRoute({
  name: 'chapters',
  path: withParams('/[?chapters*]', {
    chapters: withDefault(arrayOf([String], { separator: '/' }), []),
  }),
})
```

## Redirect

Use [route redirects](/advanced-concepts/redirects) to redirect one route to another. The optional second argument maps params when the destination needs different values.

```ts
const newRoute = createRoute({
  name: 'new-route',
  path: '/new',
})

const oldRoute = createRoute({
  name: 'old-route',
  path: '/old',
})
  .redirectTo(newRoute)
```

Use a [before hook](/advanced-concepts/hooks) when the redirect depends on a condition, such as whether the user is signed in.

## Alias

Aliases are added to a route with the chainable [addAlias](/advanced-concepts/aliases) method. As in Vue Router, the address bar keeps the alias url.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
  .addAlias({ path: '/member/[id]' })
  .addAlias({ path: '/u/[id]' })
```

Unlike Vue Router, an alias can declare its own params. When they differ from the route's, a transform maps them into the route's params.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
  .addAlias({ path: '/profile/[username]' }, ({ params }) => ({ id: findIdByUsername(params.username) }))
```
