# Types: Loader\<TData, TContext\>

```ts
type Loader<TData, TContext> = TransformerOptions<Awaited<TData>> & object;
```

A reusable loader definition, with its context normalized to an array.

## Type Declaration

### context

```ts
context: TContext;
```

### load

```ts
load: AnyFunction<TData>;
```

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TData` | `unknown` |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |
