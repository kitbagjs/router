# Types: AddErrorHook()\<TRoute, TRoutes, TRejections\>

```ts
type AddErrorHook<TRoute, TRoutes, TRejections> = (hook) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`ErrorHook`](ErrorHook.md)\<`TRoute`, `TRoutes`, `TRejections`\> |

## Returns

[`HookRemove`](HookRemove.md)
