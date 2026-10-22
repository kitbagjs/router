# Types: CreateViewOptions\<TComponent, TContext, TProps, TRoutes\>

```ts
type CreateViewOptions<TComponent, TContext, TProps, TRoutes> = TransformerOptions<NoInfer<Awaited<TProps>>> & object & Partial<ComponentProps<TComponent>> extends ComponentProps<TComponent> ? object : object;
```

Options for a reusable component and its props getter.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcomponent"></a> `TComponent` *extends* `Component` | `Component` |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |
| <a id="type-parameter-tprops"></a> `TProps` *extends* `MaybePromise`\<`ComponentProps`\<`TComponent`\>\> \| `undefined` | `undefined` |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |

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
