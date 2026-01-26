# Types: AddPluginErrorHook()\<TRoutes, TRejections\>

```ts
type AddPluginErrorHook<TRoutes, TRejections> = (hook) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`PluginErrorHook`](PluginErrorHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`HookRemove`](HookRemove.md)
