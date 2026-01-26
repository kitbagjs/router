# Types: AddBeforeLeaveHook()\<TRoutes, TRejections, TRouteTo, TRouteFrom\>

```ts
type AddBeforeLeaveHook<TRoutes, TRejections, TRouteTo, TRouteFrom> = (hook) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |
| `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`BeforeLeaveHook`](BeforeLeaveHook.md)\<`TRoutes`, `TRejections`, `TRouteTo`, `TRouteFrom`\> |

## Returns

[`HookRemove`](HookRemove.md)
