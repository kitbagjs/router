# Types: ExternalRouteHooks\<TRoute, TContext\>

```ts
type ExternalRouteHooks<TRoute, TContext> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |
| `TContext` *extends* `RouteContext`[] \| `undefined` | `undefined` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | [`AddBeforeEnterHook`](AddBeforeEnterHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, `TRoute`, [`Route`](Route.md)\> | Registers a route hook to be called before the route is entered. |
