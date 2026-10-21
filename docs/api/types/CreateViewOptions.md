# Types: CreateViewOptions\<TComponent, TContext, TProps, TRoutes\>

```ts
type CreateViewOptions<TComponent, TContext, TProps, TRoutes> = TransformerOptions<NoInfer<Awaited<TProps>>> & object & Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent> ? object : object;
```

Options for a reusable component and its props getter.

## Type Declaration

### component

```ts
component: TComponent;
```

### context?

```ts
optional context?: TContext;
```

See [Context](https://kitbag-router.netlify.app/advanced-concepts/context).

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TComponent` *extends* `Component` | `Component` |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |
| `TProps` *extends* `MaybePromise`\<`ComponentProps`\<`TComponent`\>\> \| `undefined` | `undefined` |
| `TRoutes` *extends* `Routes` | `Routes` |
