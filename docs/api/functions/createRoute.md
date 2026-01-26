# Functions: createRoute()

```ts
function createRoute<TOptions, TProps>(options, ...args): ToRoute<TOptions, TProps> & InternalRouteHooks<ToRoute<TOptions>, ExtractRouteContext<TOptions>> & RouteRedirects<ToRoute<TOptions>>;
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

[`ToRoute`](../types/ToRoute.md)\<`TOptions`, `TProps`\> & [`InternalRouteHooks`](../types/InternalRouteHooks.md)\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `ExtractRouteContext`\<`TOptions`\>\> & `RouteRedirects`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>\>
