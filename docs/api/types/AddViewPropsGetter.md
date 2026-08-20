# Types: AddViewPropsGetter\<TRoute, TComponent\>

```ts
type AddViewPropsGetter<TRoute, TComponent> = (route, context) => MaybePromise<ComponentProps<TComponent>>;
```

The props getter for a view added via `addView`. Receives the same two arguments as the
`createRoute` props callback: the resolved route and a context object.

## Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`Route`](Route.md) |
| `TComponent` *extends* `Component` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\> & [`WithData`](WithData.md)\<`TRoute`\> |
| `context` | [`AddViewPropsCallbackContext`](AddViewPropsCallbackContext.md)\<`TRoute`\> |

## Returns

`MaybePromise`\<`ComponentProps`\<`TComponent`\>\>
