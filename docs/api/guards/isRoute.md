# isRoute

```ts
export function isRoute(route: unknown): route is RouterRoute

export function isRoute<
  TRoute extends RouterRoute,
  TRouteKey extends TRoute['key']
>(route: TRoute, routeKey: TRouteKey, options: IsRouteOptions & { exact: true }): route is TRoute & { key: TRouteKey }

export function isRoute<
  TRoute extends RouterRoute,
  TRouteKey extends TRoute['key']
>(route: TRoute, routeKey: TRouteKey, options?: IsRouteOptions): route is TRoute & { key: `${TRouteKey}${string}` }

export function isRoute<
  TRouteKey extends RegisteredRoutesKey
>(route: unknown, routeKey: TRouteKey, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { key: TRouteKey }

export function isRoute<
  TRouteKey extends RegisteredRoutesKey
>(route: unknown, routeKey: TRouteKey, options?: IsRouteOptions): route is RegisteredRouterRoute & { key: `${TRouteKey}${string}` }
```

Type guards that asserts a value is `RouterRoute` and optionally that it is also a specific route based on a route key.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRouteKey` *extends* `string` | A string type that should match route key of RegisteredRouteMap, ensuring the route key exists. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `route` | `RouterRoute` | The current route |
| `routeKey` | `TRouteKey` | Optional. The key of the route to validate against. |
| `options.exact` | `boolean` | Optional. If `true` a parent of the current route will not be considered a match |
