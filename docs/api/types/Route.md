# Route

```ts
type Route<TName, TPath, TQuery>: object;
```

Represents the structure of a route within the application. Return value of `createRoute`

## Type parameters

| Type parameter | Value | Description |
| :------ | :------ | :------ |
| `TName` *extends* `string` \| `undefined` | `string` | Represents the unique name identifying the route, typically a string. |
| `TPath` *extends* `string` \| `Path` | `Path` | The type or structure of the route's path. |
| `TQuery` *extends* `string` \| `Query` \| `undefined` | `Query` | The type or structure of the query parameters associated with the route. |

## Type declaration

### depth

```ts
depth: number;
```

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

### path

```ts
path: ToPath<TPath>;
```

Represents the structured path of the route, including path params.

### query

```ts
query: ToQuery<TQuery>;
```

Represents the structured query of the route, including query params.

### prefetch

```ts
prefetch?: boolean | PrefetchConfigOptions;
```

Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch. [PrefetchConfigOptions](/api/types/PrefetchConfigOptions)
