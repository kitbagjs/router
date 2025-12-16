# Types: RouterErrorHook()\<TRoutes, TRejections\>

```ts
type RouterErrorHook<TRoutes, TRejections> = (error, context) => void;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |
| `context` | [`RouterErrorHookContext`](RouterErrorHookContext.md)\<`TRoutes`, `TRejections`\> |

## Returns

`void`
