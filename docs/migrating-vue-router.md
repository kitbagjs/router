# Migrating from vue-router

:white_check_mark: Nested routes mapping  
:white_check_mark: Dynamic Routing  
:white_check_mark: Modular, component-based router configuration  
:white_check_mark: Route params, query, wildcards  
:white_check_mark: View transition effects powered by Vue.js' transition system or the View Transitions API  
:white_check_mark: Fine-grained navigation control  
:white_check_mark: Links with automatic active CSS classes  
:white_check_mark: HTML5 history mode or hash mode  
:x: Customizable Scroll Behavior  
:white_check_mark: Proper encoding for URLs  

## Child Routes

Child routes in vue-router have very different behavior depending on if the path starts with `/` or not. In Kitbag Router, the behavior is always the same, so add slashes where you want them and leave them off where you don't.

::: info
A named route's final path (its own path combined with any parents) must start with `/`. Otherwise it can never match a url and the router throws an `UnreachableRouteError`.
:::

## Props Binding

With vue-router you can bind all the route params to the component automatically with the `route.props` attribute. However, this is NOT type safe. Kitbag Router gives you a type safe way to bind props. If the component you assign to a route has required props, you'll get a Typescript error until you satisfy the props.

## Route Regex

Kitbag Router support FULL regex pattern matching in both the path and query. The only caveat is that your regex must be encapsulated by a param.

```ts
import { createRoute, withParams } from '@kitbag/router'

const route = createRoute({
  path: withParams('/[pattern]', { pattern: /\d{2}-\d{2}-\d{4}/g })
})
```

The param will be used to verify any potential matches from the URL, regardless of if you actually use the param value stored on `route.params`.

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

oldRoute.redirectTo(newRoute)
// Alternatively: newRoute.redirectFrom(oldRoute)
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
}).addAlias({ path: '/profile/[username]' }, ({ params }) => ({ id: findIdByUsername(params.username) }))
```
