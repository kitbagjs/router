# isRoute

```ts
function isRoute<TRouteKey>(route: RouterRoute, routeKey: TRouteKey, options?: isRouteOptions): route is RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>>
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
