# Router Route

The current route is represented by the [RouterRoute](/api/types/RouterRoute.md).

This current route is accessed using the [useRoute](/composables/useRoute.md) composable within your components. It is also available on the router instance as the `route` property.

```ts
import { useRoute } from '@kitbag/router'

const route = useRoute()
```

There are a number of properties and methods available on the router route. These properties are reactive and will update when the route changes. We'll use these example routes to demonstrate the properties:

```ts
const home = createRoute({
  name: 'home',
  path: '/',
})

const blog = createRoute({
  name: 'blog',
  path: '/blog',
})

const blogPost = createRoute({
  parent: blog,
  name: 'blogPost',
  path: path('/[blogPostId]', {
    blogPostId: Number,
  }),
})
```

## Name

The name of the route is available on the `name` property. This can be used to identify the current route. It can also be used to type narrow the route similar to how you could use the [isRoute](/api/type-guards/isRoute.md) type guard.

```ts
const route = useRoute() 
//     ^ ? { name: 'home', ... } | { name: 'blog', ... } | { name: 'blogPost', ... }

if (route.name === 'home') {
  route
  // ^? { name: 'home', ... }
}
```

## Matched

The specific route being viewed is available on the `matched` property. This is the single route that was matched to the current router location. If the location is `/blog/123`, the `matched` property will be the `blogPost` route.

```ts
const matched = route.matched
```

## Matches

All the routes that were matched to the current router location are available on the `matches` property. This includes the matched route, as well as any parent routes. If the location is `/blog/123`, the `matches` property will be `[blog, blogPost]`.

```ts
const matches = route.matches
```

## Hash

The hash of the current route is available on the `hash` property. This is the [hash](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash) property of the current router location. If the location is `/blog/123#comments`, the `hash` property will be `'comments'`.

```ts
const hash = route.hash
```

## Href

The href property is the current router location as a [Url](/api/types/Url.md) string. This will reflect the current browser [location](https://developer.mozilla.org/en-US/docs/Web/API/Location).

```ts
const href = route.href
```

## Params

Any [params](/core-concepts/params) that were matched to the current route are available on the `params` property. If the location is `/blog/123`, the `params` property will be `{ blogPostId: 123 }`.

```ts
const params = route.params
```

The `params` property is also writable. Updating params will update the route and the router location. This is the same as using the [update](/core-concepts/router-route#update) method.

```ts
route.params = { blogPostId: 456 }
```

You can also update individual params

```ts
route.params.blogPostId = 789
```

:::tip Type Safety
The router route and its params are type safe. So you might need to narrow the route to access and set the params.
:::

## Query

The `query` property is the [search](https://developer.mozilla.org/en-US/docs/Web/API/Location/search) of the current router location. If the location is `/blog?page=1`, the `query` property will be `URLSearchParams { 'page' => '1' }`.

```ts
const page = route.query.get('page')
```

The `query` property is also writable. Updating the `query` property will update the route and the router location. This is the same as using the [update](/core-concepts/router-route#update) method.

```ts
route.query = new URLSearchParams({ page: '2' })
```

You can also update individual query params

```ts
route.query.set('page', '3')
```

## State

The `state` property is the [state](/core-concepts/routes#state) of the current route. This `state` property is also writable.

```ts
const state = route.state
```

## Update

The `update` method is used to update the route and the router location. This is the same as using the router's [push](/core-concepts/router#push) method but you don't have to provide the route name and you don't have to provide a value for all params. All the options are the same.

```ts
route.update({ blogPostId: 456 }, options)
```

You can also update individual params

```ts
route.update('blogPostId', 789, options)
```

:::tip Multiple Params
Any existing params on the route that are not provided will be preserved.
:::
