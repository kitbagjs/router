# Types: RouteAddView\<TUrl, TMatches\>

```ts
type RouteAddView<TUrl, TMatches> = object;
```

Adds a view (component + optional props getter) to a route. Chainable to register multiple views,
including named views for named `<router-view />`s.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-turl"></a> `TUrl` *extends* [`Url`](Url.md) | [`Url`](Url.md) |
| <a id="type-parameter-tmatches"></a> `TMatches` *extends* [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | [`CreatedRouteOptions`](CreatedRouteOptions.md)[] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="addview"></a> `addView` | \<`TSource`, `TName`, `TGetter`\>(`source`, ...`options`) => `TSource` *extends* `AnyView` ? `AddViewReturn`\<`TUrl`, `TMatches`, `TName`, `ViewPropsOf`\<`TSource`\>, \[`...TSource["context"]`\]\> : `AddViewReturn`\<`TUrl`, `TMatches`, `TName`, `NewViewProps`\<[`Route`](Route.md)\<`TUrl`, `TMatches`\>, `Extract`\<`TSource`, `Component`\>, `TGetter`\>\> | Adds a view for this route. |
