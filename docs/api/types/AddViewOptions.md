# Types: AddViewOptions\<TName, TGetter\>

```ts
type AddViewOptions<TName, TGetter> = TransformerOptions<PayloadValueOf<TGetter>> & object;
```

The options for a view added via `addView`.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| <a id="type-parameter-tname"></a> `TName` *extends* `string` \| `undefined` | `string` | The view's name, inferred from the `name` option. |
| <a id="type-parameter-tgetter"></a> `TGetter` | [`AddViewPropsGetter`](AddViewPropsGetter.md)\<[`Route`](Route.md), `Component`\> | The view's props getter, inferred from the `props` option. |

## Type Declaration

### name?

```ts
name?: TName;
```

The name of the view, rendered by `<router-view name="..." />`. Defaults to the unnamed view.

### prefetch?

```ts
prefetch?: PrefetchConfig;
```

Determines what assets are prefetched for this view when a router-link is rendered for this route.
Overrides route level prefetch, and is itself overridden by link level prefetch.

### props?

```ts
props?: TGetter;
```

A props getter for the view. Receives the resolved route and a context object.
