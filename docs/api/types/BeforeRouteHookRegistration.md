# Types: BeforeRouteHookRegistration

```ts
type BeforeRouteHookRegistration = object;
```

## Properties

| Property | Type |
| ------ | ------ |
| <a id="depth"></a> `depth` | `number` |
| <a id="hook"></a> `hook` | [`BeforeRouteHook`](BeforeRouteHook.md) |
| <a id="lifecycle"></a> `lifecycle` | `"onBeforeRouteEnter"` \| `"onBeforeRouteUpdate"` \| `"onBeforeRouteLeave"` |
