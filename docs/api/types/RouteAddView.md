# Types: RouteAddView\<TUrl, TMatches\>

```ts
type RouteAddView<TUrl, TMatches> = object;
```

Adds a view (component + optional props getter) to a route. Chainable to register multiple views,
including named views for named `<router-view />`s.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUrl` *extends* [`Url`](Url.md) | [`Url`](Url.md) |
| `TMatches` *extends* [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | [`CreatedRouteOptions`](CreatedRouteOptions.md)[] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="addview"></a> `addView` | \<`TComponent`, `TName`, `TGetter`\>(`component`, ...`options`) => `AddViewReturn`\<`TUrl`, `TMatches`, `AddViewProps`\<`CurrentMatchViews`\<`TMatches`\>, `TName`, `NewViewProps`\<[`Route`](Route.md)\<`TUrl`, `TMatches`\>, `TComponent`, `TGetter`\>\>\> | Adds a view for this route. |
