# Types: WithHooks

```ts
type WithHooks = object;
```

Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="onafterrouteenter"></a> `onAfterRouteEnter?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onafterrouteleave"></a> `onAfterRouteLeave?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onafterrouteupdate"></a> `onAfterRouteUpdate?` | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> |
| <a id="onbeforerouteenter"></a> `onBeforeRouteEnter?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
| <a id="onbeforerouteleave"></a> `onBeforeRouteLeave?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
| <a id="onbeforerouteupdate"></a> `onBeforeRouteUpdate?` | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> |
