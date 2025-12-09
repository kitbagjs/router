# Types: AddComponentAfterRouteHook()\<TRoutes, TRejections\>

```ts
type AddComponentAfterRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |
| `TRejections` *extends* `PropertyKey` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | `AfterRouteHookRegistration`\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
