# Types: RouterErrorHook()\<TRoutes, TRejections\>

```ts
type RouterErrorHook<TRoutes, TRejections> = (error, context) => void;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |
| `context` | [`RouterErrorHookContext`](RouterErrorHookContext.md)\<`TRoutes`, `TRejections`\> |

## Returns

`void`
