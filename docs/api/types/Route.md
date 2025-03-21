# Types: Route\<TName, THost, TPath, TQuery, THash, TMeta, TState, TMatches\>

```ts
type Route<TName, THost, TPath, TQuery, THash, TMeta, TState, TMatches> = object;
```

Represents the structure of a route within the application. Return value of `createRoute`

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TName` *extends* `string` | `string` | Represents the unique name identifying the route, typically a string. |
| `THost` *extends* `WithParams` | `WithParams` | - |
| `TPath` *extends* `WithParams` | `WithParams` | The type or structure of the route's path. |
| `TQuery` *extends* `WithParams` | `WithParams` | The type or structure of the query parameters associated with the route. |
| `THash` *extends* `WithParams` | `WithParams` | - |
| `TMeta` *extends* [`RouteMeta`](RouteMeta.md) | [`RouteMeta`](RouteMeta.md) | - |
| `TState` *extends* `Record`\<`string`, [`Param`](Param.md)\> | `Record`\<`string`, [`Param`](Param.md)\> | - |
| `TMatches` *extends* [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | [`CreatedRouteOptions`](CreatedRouteOptions.md)[] | - |

## Type declaration

### hash

```ts
hash: THash;
```

Represents the hash of the route.

### host

```ts
host: THost;
```

Represents the host for this route. Used for external routes.

### id

```ts
id: string;
```

Unique identifier for the route, generated by router.

### matched

```ts
matched: LastInArray<TMatches, CreatedRouteOptions>;
```

The specific route properties that were matched in the current route.

### matches

```ts
matches: TMatches;
```

The specific route properties that were matched in the current route, including any ancestors.
Order of routes will be from greatest ancestor to narrowest matched.

### meta

```ts
meta: TMeta;
```

Represents additional metadata associated with a route, combined with any parents.

### name

```ts
name: TName;
```

Identifier for the route as defined by user. Name must be unique among named routes. Name is used for routing and for matching.

### path

```ts
path: TPath;
```

Represents the structured path of the route, including path params.

### prefetch?

```ts
optional prefetch: PrefetchConfig;
```

Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.

### query

```ts
query: TQuery;
```

Represents the structured query of the route, including query params.

### state

```ts
state: TState;
```

Represents the schema of the route state, combined with any parents.
