# Types: WithData\<TRoute\>

```ts
type WithData<TRoute> = object;
```

A resolved route whose loaders' data is available. Only the route being navigated to has data: a route
the router merely resolved is not being loaded, so data on it could never settle. The current route and
a props getter's route have it, `router.resolve` and hooks do not.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="data"></a> `data` | `RouteDataOf`\<`TRoute`\[`"matches"`\]\> | What the route's loaders resolve to, keyed by loader name. A route whose only loader is unnamed exposes that loader's data here directly. Always promises, since loaders never block rendering. |
