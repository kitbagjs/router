# useRoute

```ts
export function useRoute(): RegisteredRouterRoute

export function useRoute<
  TRouteKey extends RegisteredRoutesKey
>(routeKey: TRouteKey, options: IsRouteOptions & { exact: true }): RegisteredRouterRoute & { key: TRouteKey }

export function useRoute<
  TRouteKey extends RegisteredRoutesKey
>(routeKey: TRouteKey, options?: IsRouteOptions): RegisteredRouterRoute & { key: `${TRouteKey}${string}` }
```

A composition to access the current route or verify a specific route key within a Vue component.
This function provides two overloads:

1. When called without arguments, it returns the current route from the router without types.
2. When called with a route key, it checks if the current active route includes the specified route key.

### Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRouteKey` *extends* `RegisteredRoutesKey` | A string type that should match RegisteredRoutesKey, ensuring the route key exists. |

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `routeKey` | `TRouteKey` | Optional. The key of the route to validate against the current active routes. |
| `options.exact` | `boolean` | Optional. Whether to throw if the route is not an exact match. If `true` a parent of the current route will not be considered a match |

### Returns

`RegisteredRouterRoute`

The current router route. If a route key is provided, it validates the route key first.

### Throws

Throws an error if the provided route key is not valid or does not match the current route.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route key
if provided, throwing an error if the validation fails at any point during the component's lifecycle.
