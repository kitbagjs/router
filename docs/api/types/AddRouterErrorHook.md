# Types: AddRouterErrorHook()\<TRoutes, TRejections\>

```ts
type AddRouterErrorHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RouterErrorHook`](RouterErrorHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
