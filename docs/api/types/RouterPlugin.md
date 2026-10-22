# Types: RouterPlugin\<TRoutes, TRejections\>

```ts
type RouterPlugin<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="rejections"></a> `rejections` | `TRejections` | The rejections supplied by the plugin. |
| <a id="routes"></a> `routes` | `TRoutes` | The routes supplied by the plugin. |
