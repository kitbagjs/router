# Types: CreatedRouteOptions

```ts
type CreatedRouteOptions = Omit<CreateRouteOptions, "component" | "components"> & object;
```

The Route properties originally provided to `createRoute`, plus the views that route renders and the
loaders it runs. The deprecated `component`/`components` options are folded into `views` (see
[RouteViews](RouteViews.md)).

## Type Declaration

### id

```ts
id: string;
```

### loaders

```ts
loaders: RouteLoaders;
```

### views

```ts
views: RouteViews;
```
