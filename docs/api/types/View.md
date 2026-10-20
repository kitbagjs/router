# Types: View\<TProps, TContext\>

```ts
type View<TProps, TContext> = TransformerOptions<Awaited<TProps>> & object;
```

A reusable view definition with its props getter's result and declared context.

## Type Declaration

### component

```ts
component: Component;
```

### context

```ts
context: TContext;
```

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

### props?

```ts
optional props?: AnyFunction<TProps>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TProps` | `unknown` |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |
