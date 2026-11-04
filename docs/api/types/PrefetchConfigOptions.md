# Types: PrefetchConfigOptions

```ts
type PrefetchConfigOptions = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="components"></a> `components?` | `boolean` \| [`PrefetchStrategy`](PrefetchStrategy.md) | When true any component that is wrapped in vue's defineAsyncComponent will be prefetched **Default** `'eager'` |
| <a id="loaders"></a> `loaders?` | `boolean` \| [`PrefetchStrategy`](PrefetchStrategy.md) | When true route loaders will be prefetched **Default** `false` |
| <a id="props"></a> `props?` | `boolean` \| [`PrefetchStrategy`](PrefetchStrategy.md) | When true route props will be prefetched **Default** `false` |
