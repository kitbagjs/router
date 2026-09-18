# Migrating from vue-router

:white_check_mark: Nested routes mapping  
:white_check_mark: Dynamic Routing  
:white_check_mark: Modular, component-based router configuration  
:white_check_mark: Route params, query, wildcards  
:white_check_mark: View transition effects powered by Vue.js' transition system  
:white_check_mark: Fine-grained navigation control  
:white_check_mark: Links with automatic active CSS classes  
:white_check_mark: HTML5 history mode or hash mode  
:x: Customizable Scroll Behavior  
:white_check_mark: Proper encoding for URLs  

## Child Routes

Child routes in vue-router have very different behavior depending on if the path starts with `/` or not. In Kitbag Router, the behavior is always the same, so add slashes where you want them and leave them off where you don't.

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

Kitbag Router does support repeatable params like [vue-router](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#Repeatable-params), but the syntax is different. By default Kitbag params capture everything including slashes, so a route that ends in a param will be considered a match.

```ts
{
  name: 'repeated-params',
  path: '/[chapters]',
},
```

This param will expect at least (1) character past the slash to match, but will match

- `/one`
- `/one/two`
- `/one/two/three`
- etc

Then to convert the captured value into an array, you'll need to define a [custom param](/core-concepts/params#custom-param-types).

```ts
import { ParamGetSet } from '@kitbag/router'

const stringArrayParam: ParamGetSet<string[]> = {
  get: (value) => {
    return value.split('/')
  },
  set: value => value.join('/'),
}
```

Which is applied to the route with `withParams`.

```ts
{
  name: 'repeated-params',
  path: withParams('/[chapters]', { chapters: stringArrayParam }),// [!code focus]
},
```

If you make the param optional, it will also match just a slash `/`, the param value would be an empty array `[]`.

## Redirect

In order to setup redirects for your routes, you'll have to use route [hooks](/advanced-concepts/hooks).

```ts
const newRoute = createRoute({
  name: 'new-route',
  path: '/new',
})

const oldRoute = createRoute({
  name: 'old-route',
  path: '/old',
  context: [newRoute],
})

oldRoute.onBeforeRouteEnter((to, { replace }) => {
  replace('new-route')
})
```

## Alias

Aliases are added to a route with the chainable [addAlias](/advanced-concepts/aliases) method. As in Vue Router, the address bar keeps the alias url.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
})
  .addAlias('/member/[id]')
  .addAlias('/u/[id]')
```

Unlike Vue Router, an alias can declare its own params. When they differ from the route's, a transform maps them into the route's params.

```ts
const user = createRoute({
  name: 'user',
  path: '/user/[id]',
}).addAlias('/profile/[username]', ({ params }) => ({ id: findIdByUsername(params.username) }))
```
