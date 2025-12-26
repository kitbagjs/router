# Types: InternalRouteHooks\<TContext\>

```ts
type InternalRouteHooks<TContext> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* `RouteContext`[] \| `undefined` | `undefined` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called after the route is entered. |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called after the route is left. |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called after the route is updated. |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called before the route is entered. |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called before the route is left. |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>\> | Registers a route hook to be called before the route is updated. |
