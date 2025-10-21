# Types: AddComponentBeforeRouteHook()\<TRoutes\>

```ts
type AddComponentBeforeRouteHook<TRoutes> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`BeforeRouteHookRegistration`](BeforeRouteHookRegistration.md)\<`TRoutes`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
