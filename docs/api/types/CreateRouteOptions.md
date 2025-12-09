# Types: CreateRouteOptions\<TName, TPath, TQuery, THash, TMeta\>

```ts
type CreateRouteOptions<TName, TPath, TQuery, THash, TMeta> = WithHooks & object;
```

## Type Declaration

### component?

```ts
optional component: Component;
```

An optional component to render when this route is matched.

#### Default

```ts
RouterView
```

### components?

```ts
optional components: Record<string, Component>;
```

An object of named components to render using named views

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

### parent?

```ts
optional parent: Route;
```

An optional parent route to nest this route under.

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

### ~~props?~~

```ts
optional props: never;
```

Props have been moved to the second argument of `createRoute`. This property can no longer be used.

#### Deprecated

### query?

```ts
optional query: TQuery;
```

Query (aka search) part of URL.

### state?

```ts
optional state: Record<string, Param>;
```

Type params for additional data intended to be stored in history state, all keys will be optional unless a default is provided.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TName` *extends* `string` \| `undefined` | `string` \| `undefined` |
| `TPath` *extends* `string` \| `WithParams` \| `undefined` | `string` \| `WithParams` \| `undefined` |
| `TQuery` *extends* `string` \| `WithParams` \| `undefined` | `string` \| `WithParams` \| `undefined` |
| `THash` *extends* `string` \| `WithParams` \| `undefined` | `string` \| `WithParams` \| `undefined` |
| `TMeta` *extends* [`RouteMeta`](RouteMeta.md) | [`RouteMeta`](RouteMeta.md) |
