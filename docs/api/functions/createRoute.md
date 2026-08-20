# Functions: createRoute()

```ts
function createRoute<TOptions, TProps>(options, ...args): RouteWithMethods<ToRouteUrl<TOptions>, ToRouteMatches<TOptions, TProps>>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) |
| `TProps` *extends* \| [`PropsGetter`](../types/PropsGetter.md)\<`TOptions`, `any`\[`any`\]\> \| `RoutePropsRecord`\<`TOptions`, `any`\[`any`\]\> \| [`RouterViewPropsGetter`](../types/RouterViewPropsGetter.md)\<`TOptions`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |
| ...`args` | `CreateRouteWithProps`\<`TOptions`, `TProps`\> |

## Returns

`RouteWithMethods`\<`ToRouteUrl`\<`TOptions`\>, `ToRouteMatches`\<`TOptions`, `TProps`\>\>
