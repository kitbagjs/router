# Types: RouterViewTransition\<TRoutes\>

```ts
type RouterViewTransition<TRoutes> = object;
```

The view transition in flight, from the moment a navigation is decided to transition until its
animation finishes. `to` and `from` are known throughout, so the page being left can prepare its elements
before it is captured. `transition` is set once the browser has been asked to transition.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* `Routes` | `Routes` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="from"></a> `from` | `readonly` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `undefined` |
| <a id="istransitioning"></a> `isTransitioning` | `readonly` | `boolean` |
| <a id="to"></a> `to` | `readonly` | \| [`RouterResolvedRouteUnion`](RouterResolvedRouteUnion.md)\<`TRoutes`\> \| `undefined` |
| <a id="transition"></a> `transition` | `readonly` | `ViewTransition` \| `undefined` |
| <a id="types"></a> `types` | `readonly` | [`ViewTransitionTypes`](ViewTransitionTypes.md) |
