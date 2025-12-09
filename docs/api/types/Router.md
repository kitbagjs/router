# Types: Router\<TRoutes, TOptions, TPlugin\>

```ts
type Router<TRoutes, TOptions, TPlugin> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | `any` |
| `TOptions` *extends* [`RouterOptions`](RouterOptions.md) | `any` |
| `TPlugin` *extends* [`RouterPlugin`](RouterPlugin.md) | `any` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="back"></a> `back` | () => `void` | Navigates to the previous entry in the browser's history stack. |
| <a id="find"></a> `find` | (`url`, `options?`) => [`ResolvedRoute`](ResolvedRoute.md) \| `undefined` | Creates a ResolvedRoute record for a given URL. |
| <a id="forward"></a> `forward` | () => `void` | Navigates to the next entry in the browser's history stack. |
| <a id="go"></a> `go` | (`delta`) => `void` | Moves the current history entry to a specific point in the history stack. |
| <a id="install"></a> `install` | (`app`) => `void` | Installs the router into a Vue application instance. |
| <a id="isexternal"></a> `isExternal` | (`url`) => `boolean` | Given a URL, returns true if host does not match host stored on router instance |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called after a route is entered. |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called after a route is left. |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate` | [`AddRouterAfterRouteHook`](AddRouterAfterRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called after a route is updated. |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called before a route is entered. |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called before a route is left. |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate` | [`AddRouterBeforeRouteHook`](AddRouterBeforeRouteHook.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\], \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Registers a hook to be called before a route is updated. |
| <a id="prefetch"></a> `prefetch?` | [`PrefetchConfig`](PrefetchConfig.md) | Determines what assets are prefetched. |
| <a id="push"></a> `push` | [`RouterPush`](RouterPush.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\]\> | Navigates to a specified path or route object in the history stack, adding a new entry. |
| <a id="refresh"></a> `refresh` | () => `void` | Forces the router to re-evaluate the current route. |
| <a id="reject"></a> `reject` | [`RouterReject`](RouterReject.md)\< \| keyof `TOptions`\[`"rejections"`\] \| `KeysOfUnion`\<`TPlugin`\[`"rejections"`\]\>\> | Handles route rejection based on a specified rejection type. |
| <a id="replace"></a> `replace` | [`RouterReplace`](RouterReplace.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\]\> | Replaces the current entry in the history stack with a new one. |
| <a id="resolve"></a> `resolve` | [`RouterResolve`](RouterResolve.md)\<`TRoutes` \| `TPlugin`\[`"routes"`\]\> | Creates a ResolvedRoute record for a given route name and params. |
| <a id="route"></a> `route` | \| [`RouterRouteUnion`](RouterRouteUnion.md)\<`TRoutes`\> \| [`RouterRouteUnion`](RouterRouteUnion.md)\<`TPlugin`\[`"routes"`\]\> | Manages the current route state. |
| <a id="start"></a> `start` | () => `Promise`\<`void`\> | Initializes the router based on the initial route. Automatically called when the router is installed. Calling this more than once has no effect. |
| <a id="started"></a> `started` | `Ref`\<`boolean`\> | Returns true if the router has been started. |
| <a id="stop"></a> `stop` | () => `void` | Stops the router and teardown any listeners. |
