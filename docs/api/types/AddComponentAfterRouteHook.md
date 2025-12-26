# Types: AddComponentAfterRouteHook()\<TRoutes, TRejections\>

```ts
type AddComponentAfterRouteHook<TRoutes, TRejections> = (hook) => RouteHookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejection`[] | `Rejection`[] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | `AfterRouteHookRegistration`\<`TRoutes`, `TRejections`\> |

## Returns

[`RouteHookRemove`](RouteHookRemove.md)
