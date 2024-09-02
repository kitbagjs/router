# isRoute

```ts
export function isRoute(route: unknown): route is RouterRoute

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is TRoute & { name: TRouteName }

export function isRoute<
  TRoute extends RouterRoute,
  TRouteName extends TRoute['name']
>(route: TRoute, routeName: TRouteName, options?: IsRouteOptions): route is TRoute & { name: `${TRouteName}${string}` }

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options: IsRouteOptions & { exact: true }): route is RegisteredRouterRoute & { name: TRouteName }

export function isRoute<
  TRouteName extends RegisteredRoutesName
>(route: unknown, routeName: TRouteName, options?: IsRouteOptions): route is RegisteredRouterRoute & { name: `${TRouteName}${string}` }
```

Type guards that asserts a value is `RouterRoute` and optionally that it is also a specific route based on a route name.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRouteName` *extends* `string` | A string type that should match route name of RegisteredRouteMap, ensuring the route name exists. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `route` | `RouterRoute` | The current route |
| `routeName` | `TRouteName` | Optional. The name of the route to validate against. |
| `options.exact` | `boolean` | Optional. If `true` a parent of the current route will not be considered a match |
