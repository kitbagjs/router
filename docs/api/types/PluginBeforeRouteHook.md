# Types: PluginBeforeRouteHook()\<TRoutes, TRejections\>

```ts
type PluginBeforeRouteHook<TRoutes, TRejections> = (to, context) => MaybePromise<void>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `to` | [`ResolvedRoute`](ResolvedRoute.md) |
| `context` | `PluginBeforeRouteHookContext`\<`TRoutes`, `TRejections`\> |

## Returns

`MaybePromise`\<`void`\>
