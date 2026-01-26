# Types: RouterPlugin\<TRoutes, TRejections\>

```ts
type RouterPlugin<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Rejections` | `Rejections` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="hooks"></a> `hooks` | `Hooks` | **`Internal`** The hooks supplied by the plugin. |
| <a id="rejections"></a> `rejections` | `TRejections` | **`Internal`** The rejections supplied by the plugin. * |
| <a id="routes"></a> `routes` | `TRoutes` | **`Internal`** The routes supplied by the plugin. |
