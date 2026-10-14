# Types: RouteViews

```ts
type RouteViews = Record<string, RouteView<unknown>>;
```

The views for a single match, keyed by view name (the unnamed view under 'default'). Each match in
`route.matches` carries its own views.
