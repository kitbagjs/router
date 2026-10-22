# Functions: createRouterPlugin()

```ts
function createRouterPlugin<TRoutes, TRejections>(plugin): RouterPlugin<TRoutes, TRejections> & PluginRouteHooks<TRoutes, TRejections>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | \[\] |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](../types/Rejections.md) | \[\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `plugin` | [`CreateRouterPluginOptions`](../types/CreateRouterPluginOptions.md)\<`TRoutes`, `TRejections`\> |

## Returns

[`RouterPlugin`](../types/RouterPlugin.md)\<`TRoutes`, `TRejections`\> & `PluginRouteHooks`\<`TRoutes`, `TRejections`\>
