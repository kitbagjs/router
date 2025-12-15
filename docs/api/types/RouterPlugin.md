# Types: RouterPlugin\<TRoutes, TRejections\>

```ts
type RouterPlugin<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
| <a id="rejections"></a> `rejections?` | `TRejections` |
| <a id="routes"></a> `routes` | `TRoutes` |
