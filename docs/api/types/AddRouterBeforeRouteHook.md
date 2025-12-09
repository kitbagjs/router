# Types: AddRouterBeforeRouteHook()\<TRoutes, TRejections\>

```ts
type AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `PropertyKey` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterBeforeRouteHook`](RouterBeforeRouteHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
