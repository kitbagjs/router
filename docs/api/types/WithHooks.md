# Types: WithHooks

```ts
type WithHooks = object;
```

Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="onafterrouteenter"></a> ~~`onAfterRouteEnter?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** Use router.onAfterRouteEnter instead |
| <a id="onafterrouteleave"></a> ~~`onAfterRouteLeave?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** Use router.onAfterRouteLeave instead |
| <a id="onafterrouteupdate"></a> ~~`onAfterRouteUpdate?`~~ | `MaybeArray`\<[`AfterRouteHook`](AfterRouteHook.md)\> | **Deprecated** Use router.onAfterRouteUpdate instead |
| <a id="onbeforerouteenter"></a> ~~`onBeforeRouteEnter?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** Use router.onBeforeRouteEnter instead |
| <a id="onbeforerouteleave"></a> ~~`onBeforeRouteLeave?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** Use router.onBeforeRouteLeave instead |
| <a id="onbeforerouteupdate"></a> ~~`onBeforeRouteUpdate?`~~ | `MaybeArray`\<[`BeforeRouteHook`](BeforeRouteHook.md)\> | **Deprecated** Use router.onBeforeRouteUpdate instead |
