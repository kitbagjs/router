# Types: RouteViews

```ts
type RouteViews = Record<string, RouteView<unknown>>;
```

The views for a single route, keyed by view name (the unnamed view under 'default'). Indexed by depth in
`route.views` — parallel to how `route.matches` indexes the matched options, which is where a route's id
comes from at a given depth.
