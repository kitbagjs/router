# Types: AddViewPropsGetter\<TRoute, TComponent\>

```ts
type AddViewPropsGetter<TRoute, TComponent> = (route, context) => MaybePromise<ComponentProps<TComponent>>;
```

The props getter for a view added via `addView`. Receives the resolved route and a context object.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-troute"></a> `TRoute` *extends* [`Route`](Route.md) |
| <a id="type-parameter-tcomponent"></a> `TComponent` *extends* `Component` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRoute`](ResolvedRoute.md)\<`TRoute`\> & [`WithData`](WithData.md)\<`TRoute`\> |
| `context` | [`AddViewPropsCallbackContext`](AddViewPropsCallbackContext.md)\<`TRoute`\> |

## Returns

`MaybePromise`\<`ComponentProps`\<`TComponent`\>\>
