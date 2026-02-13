# Types: CreateRouteOptions\<TName, TMeta\>

```ts
type CreateRouteOptions<TName, TMeta> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TName` *extends* `string` \| `undefined` | `string` \| `undefined` |
| `TMeta` *extends* [`RouteMeta`](RouteMeta.md) | [`RouteMeta`](RouteMeta.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="component"></a> `component?` | `Component` | An optional component to render when this route is matched. **Default** `RouterView` |
| <a id="components"></a> `components?` | `Record`\<`string`, `Component`\> | An object of named components to render using named views |
| <a id="context"></a> `context?` | `RouteContext`[] | Related routes and rejections for the route. The context is exposed to the hooks and props callback functions for this route. |
| <a id="hash"></a> `hash?` | `string` \| `UrlPart` | Hash part of URL. |
| <a id="meta"></a> `meta?` | `TMeta` | Represents additional metadata associated with a route, customizable via declaration merging. |
| <a id="name"></a> `name?` | `TName` | Name for route, used to create route keys and in navigation. |
| <a id="parent"></a> `parent?` | [`Route`](Route.md) | An optional parent route to nest this route under. |
| <a id="path"></a> `path?` | `string` \| `UrlPart` | Path part of URL. |
| <a id="prefetch"></a> `prefetch?` | [`PrefetchConfig`](PrefetchConfig.md) | Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch. |
| <a id="query"></a> `query?` | `string` \| `UrlQueryPart` | Query (aka search) part of URL. |
| <a id="state"></a> `state?` | `Record`\<`string`, [`Param`](Param.md)\> | Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided. |
