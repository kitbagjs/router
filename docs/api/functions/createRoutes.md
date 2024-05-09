# createRoutes()

```ts
function createRoutes<TRoutes>(routes): FlattenRoutes<TRoutes>
```

Creates an array of routes from a defined set of route properties, handling hierarchical route combinations.
This function also validates for duplicate parameter keys across the combined routes.

## Type parameters

| Type parameter |
| :------ |
| `TRoutes` *extends* readonly `RouteProps`[] |

## Parameters

| Parameter | Type |
| :------ | :------ |
| `routes` | `TRoutes` |

## Returns

`FlattenRoutes`\<`TRoutes`\>

An array of fully configured Route instances.
