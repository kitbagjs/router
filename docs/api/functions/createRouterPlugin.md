# Functions: createRouterPlugin()

```ts
function createRouterPlugin<TRoutes, TRejections>(plugin): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | \[\] |
| `TRejections` *extends* [`Rejections`](../types/Rejections.md) | \[\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `plugin` | [`CreateRouterPluginOptions`](../types/CreateRouterPluginOptions.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouterPlugin`](../types/RouterPlugin.md)\<`TRoutes`, `TRejections`\> & `PluginRouteHooks`\<`TRoutes`, `TRejections`\>
