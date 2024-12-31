# Types: CreateRouteOptions\<TName, TPath, TQuery, THash, TMeta\>

```ts
type CreateRouteOptions<TName, TPath, TQuery, THash, TMeta> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TName` *extends* `string` \| `undefined` | `string` \| `undefined` |
| `TPath` *extends* `string` \| `Path` \| `undefined` | `string` \| `Path` \| `undefined` |
| `TQuery` *extends* `string` \| `Query` \| `undefined` | `string` \| `Query` \| `undefined` |
| `THash` *extends* `string` \| `Hash` \| `undefined` | `string` \| `Hash` \| `undefined` |
| `TMeta` *extends* [`RouteMeta`](RouteMeta.md) | [`RouteMeta`](RouteMeta.md) |

## Type declaration

### hash?

```ts
optional hash: THash;
```

Hash part of URL.

### meta?

```ts
optional meta: TMeta;
```

Represents additional metadata associated with a route, customizable via declaration merging.

### name?

```ts
optional name: TName;
```

Name for route, used to create route keys and in navigation.

### path?

```ts
optional path: TPath;
```

Path part of URL.

### prefetch?

```ts
optional prefetch: PrefetchConfig;
```

Determines what assets are prefetched when router-link is rendered for this route. Overrides router level prefetch.

### query?

```ts
optional query: TQuery;
```

Query (aka search) part of URL.
