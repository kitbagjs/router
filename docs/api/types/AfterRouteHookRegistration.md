# Types: AfterRouteHookRegistration\<TRoutes\>

```ts
type AfterRouteHookRegistration<TRoutes> = object;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="depth"></a> `depth` | `number` |
| <a id="hook"></a> `hook` | [`RouterAfterRouteHook`](RouterAfterRouteHook.md)\<`TRoutes`\> |
| <a id="lifecycle"></a> `lifecycle` | `"onAfterRouteEnter"` \| `"onAfterRouteUpdate"` \| `"onAfterRouteLeave"` |
