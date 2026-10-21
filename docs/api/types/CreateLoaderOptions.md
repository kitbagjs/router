# Types: CreateLoaderOptions\<TContext, TData, TRoutes\>

```ts
type CreateLoaderOptions<TContext, TData, TRoutes> = TransformerOptions<NoInfer<Awaited<TData>>> & object;
```

Options for a reusable loader that receives the resolved route and its declared context helpers.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tcontext"></a> `TContext` *extends* readonly `RouteContext`[] | \[\] |
| <a id="type-parameter-tdata"></a> `TData` | `unknown` |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |

## Type Declaration

### context?

```ts
optional context?: TContext;
```

See [Context](https://kitbag-router.netlify.app/advanced-concepts/context).

### load

```ts
load: (route, context) => TData;
```

Loads a value or promise from the resolved route.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | [`ResolvedRouteUnion`](ResolvedRouteUnion.md)\<`TRoutes`\[`number`\]\> |
| `context` | [`LoaderCallbackContext`](LoaderCallbackContext.md)\<`TContext`\> |

#### Returns

`TData`

### prefetch?

```ts
optional prefetch?: PrefetchConfig;
```

Default prefetch behavior, overridable when attaching the loader.
