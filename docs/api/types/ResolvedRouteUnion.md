# Types: ResolvedRouteUnion\<TRoute\>

```ts
type ResolvedRouteUnion<TRoute> = TRoute extends Route ? ResolvedRoute<TRoute> : never;
```

Converts a union of Route types to a union of ResolvedRoute types while preserving the discriminated union structure for narrowing.
This is useful when you have a Route union (like `TRoutes[number]`) and need it to narrow properly.
Uses a distributive conditional type to ensure unions are properly distributed.

## Type Parameters

| Type Parameter |
| ------ |
| `TRoute` *extends* [`Route`](Route.md) |

## Example

```ts
type RouteUnion = RouteA | RouteB
type ResolvedUnion = ResolvedRouteUnion<RouteUnion> // ResolvedRoute<RouteA> | ResolvedRoute<RouteB>
```
