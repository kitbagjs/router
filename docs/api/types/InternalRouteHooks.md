# Types: InternalRouteHooks\<TRoute, TContext\>

```ts
type InternalRouteHooks<TRoute, TContext> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |
| `TContext` *extends* `RouteContext`[] | \[\] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter` | [`AddAfterEnterHook`](AddAfterEnterHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, `TRoute`, [`Route`](Route.md)\> | Registers a route hook to be called after the route is entered. |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave` | [`AddAfterLeaveHook`](AddAfterLeaveHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, [`Route`](Route.md), `TRoute`\> | Registers a route hook to be called after the route is left. |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate` | [`AddAfterUpdateHook`](AddAfterUpdateHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, `TRoute`, [`Route`](Route.md)\> | Registers a route hook to be called after the route is updated. |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | [`AddBeforeEnterHook`](AddBeforeEnterHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, `TRoute`, [`Route`](Route.md)\> | Registers a route hook to be called before the route is entered. |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave` | [`AddBeforeLeaveHook`](AddBeforeLeaveHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, [`Route`](Route.md), `TRoute`\> | Registers a route hook to be called before the route is left. |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate` | [`AddBeforeUpdateHook`](AddBeforeUpdateHook.md)\<\[`TRoute`\] \| `RouteContextToRoute`\<`TContext`\>, `RouteContextToRejection`\<`TContext`\>, `TRoute`, [`Route`](Route.md)\> | Registers a route hook to be called before the route is updated. |
