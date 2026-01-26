# Types: PluginErrorHook()\<TRoutes, TRejections\>

```ts
type PluginErrorHook<TRoutes, TRejections> = (error, context) => void;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |
| `context` | [`PluginErrorHookContext`](PluginErrorHookContext.md)\<`TRoutes`, `TRejections`\> |

## Returns

`void`
