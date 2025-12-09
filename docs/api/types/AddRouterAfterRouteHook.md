# Types: AddRouterAfterRouteHook()\<TRoutes, TRejections\>

```ts
type AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `PropertyKey` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterAfterRouteHook`](RouterAfterRouteHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
