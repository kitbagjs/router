# Types: ErrorHook()\<TRoute, TRoutes, TRejections\>

```ts
type ErrorHook<TRoute, TRoutes, TRejections> = (error, context) => void;
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
| `error` | `unknown` |
| `context` | [`ErrorHookContext`](ErrorHookContext.md)\<`TRoute`, `TRoutes`, `TRejections`\> |

## Returns

`void`
