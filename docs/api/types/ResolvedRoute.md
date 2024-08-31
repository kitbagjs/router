# ResolvedRoute

Represents a route that the router has matched to current browser location.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `TName` *extends* [`Route`](/api/types/Route) | Represents the unique name identifying the route. |

## Type declaration

### name

```ts
name: TName;
```

Unique identifier for the route. Name is used for routing and for matching.

### matched

```ts
matched: CreateRouteOptions;
```

The specific route properties that were matched in the current route. [CreateRouteOptions](/api/types/CreateRouteOptions)

### matches

```ts
matches: CreateRouteOptions[];
```

The specific route properties that were matched in the current route, including any ancestors.
Order of routes will be from greatest ancestor to narrowest matched. [CreateRouteOptions](/api/types/CreateRouteOptions)

### query

```ts
query: ResolvedRouteQuery;
```

Accessor for query string values from user in the current browser location. [ResolvedRouteQuery](/api/types/ResolvedRouteQuery)

### params

```ts
params: ExtractRouteParamTypes<TRoute>;
```

Name value pair for route params, values will be the user provided value from current browser location.
