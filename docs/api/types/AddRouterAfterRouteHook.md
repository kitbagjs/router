# Types: AddRouterAfterRouteHook()\<TRoutes\>

```ts
type AddRouterAfterRouteHook<TRoutes> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterAfterRouteHook`](RouterAfterRouteHook.md)\<`TRoutes`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
