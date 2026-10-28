# Types: Loader\<TData, TContext\>

```ts
type Loader<TData, TContext> = TransformerOptions<Awaited<TData>> & object;
```

A reusable loader definition, with its context normalized to an array.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tdata"></a> `TData` | `unknown` |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |

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
prefetch?: PrefetchConfig;
```
