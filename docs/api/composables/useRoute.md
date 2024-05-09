# useRoute()

## useRoute(routeKey)

```ts
function useRoute<TRouteKey>(routeKey): RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>>
```

A composition to access the current route or verify a specific route key within a Vue component.
This function provides two overloads:
1. When called without arguments, it returns the current route from the router without types.
2. When called with a route key, it checks if the current active route includes the specified route key.

### Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TRouteKey` *extends* `string` | A string type that should match route key of RegisteredRouteMap, ensuring the route key exists. |

### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `routeKey` | `TRouteKey` | Optional. The key of the route to validate against the current active routes. |

### Returns

`RouterRoute`\<`ResolvedRoute`\<[`RegisteredRouteMap`](../types/RegisteredRouteMap)\[`TRouteKey`\]\>\>

The current router route. If a route key is provided, it validates the route key first.

### Throws

Throws an error if the provided route key is not valid or does not match the current route.

The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route key
if provided, throwing an error if the validation fails at any point during the component's lifecycle.
