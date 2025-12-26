# Types: AddPluginErrorHook()\<TRoutes, TRejections\>

```ts
type AddPluginErrorHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`PluginErrorHook`](PluginErrorHook.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
