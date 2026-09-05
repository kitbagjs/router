# Types: RouteAddLoader\<TUrl, TMatches\>

```ts
type RouteAddLoader<TUrl, TMatches> = object;
```

Adds a loader to a route. Chainable to register multiple loaders, each exposed under its own name on
the resolved route's `data`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUrl` *extends* [`Url`](Url.md) | [`Url`](Url.md) |
| `TMatches` *extends* [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | [`CreatedRouteOptions`](CreatedRouteOptions.md)[] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="addloader"></a> `addLoader` | \<`TName`, `TGetter`\>(`load`, `options?`) => `AddLoaderReturn`\<`TUrl`, `TMatches`, `AddLoaderLoaders`\<`CurrentMatchLoaders`\<`TMatches`\>, `TName`, `ReturnType`\<`TGetter`\>\>\> | Adds a loader for this route. Loaders never block rendering, so their data is always a promise. |
