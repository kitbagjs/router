# Types: LoaderGetter\<TRoute\>

```ts
type LoaderGetter<TRoute> = (route, context) => unknown;
```

The getter for a loader added via `addLoader`. Receives the same two arguments as an `addView` props
getter, except that its route carries no data: a route's data includes what the loader itself is
computing, so reading it could only wait on itself. A parent's data is reached through the context.

Unlike a props getter it can return anything, since nothing binds what it returns to a component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\> |
| `context` | [`RouteCallbackContext`](RouteCallbackContext.md)\<`TRoute`\> |

## Returns

`unknown`
