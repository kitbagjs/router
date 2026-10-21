# Types: View\<TProps, TContext\>

```ts
type View<TProps, TContext> = TransformerOptions<Awaited<TProps>> & object;
```

A reusable view definition with its props getter's result and declared context.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tprops"></a> `TProps` | `unknown` |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |

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
