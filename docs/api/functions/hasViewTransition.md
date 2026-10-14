# Functions: hasViewTransition()

```ts
function hasViewTransition(match): match is CreateRouteOptions & { id: string; loaders: RouteLoaders; views: RouteViews } & { viewTransition: ViewTransitionConfig };
```

## Parameters

| Parameter | Type |
| ------ | ------ |
| `match` | [`CreatedRouteOptions`](../types/CreatedRouteOptions.md) |

## Returns

`match is CreateRouteOptions & { id: string; loaders: RouteLoaders; views: RouteViews } & { viewTransition: ViewTransitionConfig }`
