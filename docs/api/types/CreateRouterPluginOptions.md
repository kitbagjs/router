# Types: CreateRouterPluginOptions\<TRoutes, TRejections\>

```ts
type CreateRouterPluginOptions<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteenter"></a> ~~`onAfterRouteEnter?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** use plugin.onAfterRouteEnter instead |
| <a id="onafterrouteleave"></a> ~~`onAfterRouteLeave?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** use plugin.onAfterRouteLeave instead |
| <a id="onafterrouteupdate"></a> ~~`onAfterRouteUpdate?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** use plugin.onAfterRouteUpdate instead |
| <a id="onbeforerouteenter"></a> ~~`onBeforeRouteEnter?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** use plugin.onBeforeRouteEnter instead |
| <a id="onbeforerouteleave"></a> ~~`onBeforeRouteLeave?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** use plugin.onBeforeRouteLeave instead |
| <a id="onbeforerouteupdate"></a> ~~`onBeforeRouteUpdate?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** use plugin.onBeforeRouteUpdate instead |
| <a id="rejections"></a> `rejections?` | `TRejections` | - |
| <a id="routes"></a> `routes?` | `TRoutes` | - |
