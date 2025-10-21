# Types: AddRouterBeforeRouteHook()\<TRoutes\>

```ts
type AddRouterBeforeRouteHook<TRoutes> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterBeforeRouteHook`](RouterBeforeRouteHook.md)\<`TRoutes`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
