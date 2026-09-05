# Types: AddViewOptions\<TName, TGetter\>

```ts
type AddViewOptions<TName, TGetter> = object;
```

The options for a view added via `addView`.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TName` *extends* `string` \| `undefined` | `string` | The view's name, inferred from the `name` option. |
| `TGetter` | [`PropsGetter`](PropsGetter.md) | The view's props getter, inferred from the `props` option. |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="name"></a> `name?` | `TName` | The name of the view, rendered by `<router-view name="..." />`. Defaults to the unnamed view. |
| <a id="prefetch"></a> `prefetch?` | [`PrefetchConfig`](PrefetchConfig.md) | Determines what assets are prefetched for this view when a router-link is rendered for this route. Overrides route level prefetch, and is itself overridden by link level prefetch. |
| <a id="props"></a> `props?` | `TGetter` | A props getter for the view. Receives the resolved route and a context object. |
