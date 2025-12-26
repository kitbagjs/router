# Types: AddRouterAfterRouteHook()\<TRoutes, TRejections\>

```ts
type AddRouterAfterRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterAfterRouteHook`](RouterAfterRouteHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
