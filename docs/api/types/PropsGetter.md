# Types: PropsGetter()\<TOptions, TComponent\>

```ts
type PropsGetter<TOptions, TComponent> = (route, context) => MaybePromise<ComponentProps<TComponent>>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TOptions` *extends* [`CreateRouteOptions`](CreateRouteOptions.md) | [`CreateRouteOptions`](CreateRouteOptions.md) |
| `TComponent` *extends* `Component` | `Component` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md)\<[`ToRoute`](ToRoute.md)\<`TOptions`\>\> |
| `context` | [`PropsCallbackContext`](PropsCallbackContext.md)\<[`ToRoute`](ToRoute.md)\<`TOptions`\>, `TOptions`\> |

## Returns

`MaybePromise`\<`ComponentProps`\<`TComponent`\>\>
