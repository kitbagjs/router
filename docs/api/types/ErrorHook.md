# Types: ErrorHook\<TRoutes, TRejections\>

```ts
type ErrorHook<TRoutes, TRejections> = (error, context) => void;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |
| `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |
| `context` | [`ErrorHookContext`](ErrorHookContext.md)\<`TRoutes`, `TRejections`\> |

## Returns

`void`
