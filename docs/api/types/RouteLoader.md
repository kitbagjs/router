# Types: RouteLoader\<TData\>

```ts
type RouteLoader<TData> = object;
```

A single loader: how to load its data, and how to prefetch it. Unlike a view, a loader always has a
getter — a loader without one would have nothing to contribute.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TData` | `unknown` | What this loader's getter returns, carried so a route's data can be typed from it. |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="load"></a> `load` | `AnyFunction`\<`TData`\> |
| <a id="prefetch"></a> `prefetch?` | [`PrefetchConfig`](PrefetchConfig.md) |
