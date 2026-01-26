# Types: PluginRouteHooks\<TRoutes, TRejections\>

```ts
type PluginRouteHooks<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter` | `AddPluginAfterRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called after a route is entered. |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave` | `AddPluginAfterRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called after a route is left. |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate` | `AddPluginAfterRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called after a route is updated. |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter` | `AddPluginBeforeRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called before a route is entered. |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave` | `AddPluginBeforeRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called before a route is left. |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate` | `AddPluginBeforeRouteHook`\<`TRoutes`, `TRejections`\> | Registers a global hook to be called before a route is updated. |
| <a id="onerror"></a> `onError` | [`AddPluginErrorHook`](AddPluginErrorHook.md)\<`TRoutes`, `TRejections`\> | Registers a global hook to be called when an error occurs. |
