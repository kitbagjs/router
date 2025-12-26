# Types: AddRouterBeforeRouteHook()\<TRoutes, TRejections\>

```ts
type AddRouterBeforeRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterBeforeRouteHook`](RouterBeforeRouteHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
