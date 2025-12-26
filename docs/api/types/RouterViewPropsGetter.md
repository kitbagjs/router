# Types: RouterViewPropsGetter()\<TOptions\>

```ts
type RouterViewPropsGetter<TOptions> = (route, context) => MaybePromise<RouterViewProps & Record<string, unknown>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | [`CreateRouteOptions`](CreateRouteOptions.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md)\<[`ToRoute`](ToRoute.md)\<`TOptions`, `undefined`\>\> |
| `context` | [`PropsCallbackContext`](PropsCallbackContext.md)\<`TOptions`\> |

## Returns

`MaybePromise`\<`RouterViewProps` & `Record`\<`string`, `unknown`\>\>
