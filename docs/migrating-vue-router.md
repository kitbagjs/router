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

## Route Regex

Kitbag Router support FULL regex pattern matching in both the path and query. The only caveat is that your regex must be encapsulated by a param.

```ts
import { path } from '@kitbag/router'

path('/[pattern]', { pattern: /\d{2}-\d{2}-\d{4}/g })
```

The param will be used to verify any potential matches from the URL, regardless of if you actually use the param value stored on `route.params`.

## Repeatable Params

Kitbag Router does support repeatable params like [vue-router](https://router.vuejs.org/guide/essentials/route-matching-syntax.html#Repeatable-params), but the syntax is different. By default Kitbag params capture everything including slashes, so a route that ends in a param will be considered a match.

```ts
{
  name: 'repeated-params',
  path: '/[chapters]',
  component: ...
},
```

This param will expect at least (1) character past the slash to match, but will match

- `/one`
- `/one/two`
- `/one/two/three`
- etc

Then to convert the captured value into an array, you'll need to define a [custom param](/core-concepts/path-params#custom-param).

```ts
import { ParamGetSet } from '@kitbag/router'

const stringArrayParam: ParamGetSet<string[]> = {
  get: (value) => {
    return value.split('/')
  },
  set: value => value.join('/'),
}
```

Which is applied to the route with `path`.

```ts
{
  name: 'repeated-params',
  path: path('/[chapters]', { chapters: stringArrayParam }),// [!code focus]
  component: ...
},
```

If you make the param optional, it will also match just a slash `/`, the param value would be an empty array `[]`.

## Redirect

In order to setup redirects for your routes, you'll have to use route [hooks](/advanced-concepts/hooks).

```ts
{
  name: 'old-route',
  path: '/old',
  component: ...
},
{
  name: 'new-route',
  path: '/new',
  onBeforeRouteEnter: (to, { replace }) => {
    replace('old-route')
  }
}
```

## Alias

If you need additional routes that ultimately result in another route being loaded, for now you'll need to define those routes and have them redirect.

```ts
{
  name: 'actual-route',
  path: '/new',
  component: ...
},
{
  name: 'alias-route-a',
  path: '/alias-a',
  onBeforeRouteEnter: (to, { replace }) => {
    replace('actual-route')
  }
},
{
  name: 'alias-route-b',
  path: '/alias-b',
  onBeforeRouteEnter: (to, { replace }) => {
    replace('actual-route')
  }
},
```

## Named Route

Currently Kitbag Router has a 1:1 relationship between a route and a component. However, support for a feature like Named Routes is planned and tracked by [this issue](https://github.com/kitbagjs/router/issues/174).

## UseLink

Currently Kitbag Router does export much of the underlying logic for what `useLink` offers. 

:white_check_mark: `route` can be fetched for a source with `router.find`  
:white_check_mark: `href` can be fetched for a source with `router.resolve`  
:x: `isActive` is only used internally by `RouterLink` component and is not exported  
:x: `isExactActive` is only used internally by `RouterLink` component and is not exported  
:white_check_mark: `navigate` can be achieved for a source with `router.push` or `router.replace`  

Adding a similar composable is planned and tracked by [this issue](https://github.com/kitbagjs/router/issues/175).
