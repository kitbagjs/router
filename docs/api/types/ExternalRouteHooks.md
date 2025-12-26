# Types: ExternalRouteHooks\<TContext\>

```ts
type ExternalRouteHooks<TContext> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* `RouteContext`[] \| `undefined` | `undefined` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called before the route is entered. |
