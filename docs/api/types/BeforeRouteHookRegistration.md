# Types: BeforeRouteHookRegistration\<TRoutes\>

```ts
type BeforeRouteHookRegistration<TRoutes> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="depth"></a> `depth` | `number` |
| <a id="hook"></a> `hook` | [`RouterBeforeRouteHook`](RouterBeforeRouteHook.md)\<`TRoutes`\> |
| <a id="lifecycle"></a> `lifecycle` | `"onBeforeRouteEnter"` \| `"onBeforeRouteUpdate"` \| `"onBeforeRouteLeave"` |
