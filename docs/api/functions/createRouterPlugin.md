# Functions: createRouterPlugin()

```ts
function createRouterPlugin<TRoutes, TRejections>(plugin): RouterPlugin<TRoutes, TRejections>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](../types/Routes.md) | \[\] |
| `TRejections` *extends* `Record`\<`string`, `Component`\> | `object` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `plugin` | `Partial`\<[`RouterPlugin`](../types/RouterPlugin.md)\<`TRoutes`, `TRejections`\>\> |

## Returns

[`RouterPlugin`](../types/RouterPlugin.md)\<`TRoutes`, `TRejections`\>
