# Types: RouteMeta

```ts
type RouteMeta: Register extends object ? RouteMeta : Record<string, unknown>;
```

Represents additional metadata associated with a route, customizable via declaration merging.
