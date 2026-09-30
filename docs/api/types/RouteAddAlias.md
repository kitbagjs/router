# Types: RouteAddAlias\<TUrl, TMatches\>

```ts
type RouteAddAlias<TUrl, TMatches> = object;
```

Adds an alias to a route. Chainable to register several.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TUrl` *extends* [`Url`](Url.md) | [`Url`](Url.md) |
| `TMatches` *extends* [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | [`CreatedRouteOptions`](CreatedRouteOptions.md)[] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="addalias"></a> `addAlias` | \<`TOptions`\>(`options`, ...`args`) => `RouteWithMethods`\<`TUrl`, `TMatches`\> | Adds a url the route also matches. The address bar keeps the alias; the route resolves as if its own url had matched. Aliases only match inbound urls: links and navigation always target the route's own url. The alias stands in for this route's own path, query, and hash, and composes with any aliases of the route's ancestors. It declares its own params, typed the same way a route's are, and any param the route's own segment declares that the alias does not is the transform's to supply. |
