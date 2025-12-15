# Types: AddComponentBeforeRouteHook()\<TRoutes, TRejections\>

```ts
type AddComponentBeforeRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | `BeforeRouteHookRegistration`\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
