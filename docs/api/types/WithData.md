# Types: WithData\<TRoute\>

```ts
type WithData<TRoute> = object;
```

A resolved route with loader data access, as received by props getters. A route the router merely
resolved is not being loaded, so data on it could never settle. `router.resolve` and hooks do not
receive these accessors.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troute"></a> `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="data"></a> ~~`data`~~ | `RouteDataOf`\<`TRoute`\[`"matches"`\]\> | What the route's loaders resolve to, keyed by loader name. A route whose only loader is unnamed exposes that loader's data here directly. Always promises, since loaders never block rendering. **Deprecated** Use route.getData() or route.getData(name). See https://github.com/kitbagjs/router/issues/1056. |
| <a id="getdata"></a> `getData` | [`GetData`](GetData.md)\<`RouteLoadersOf`\<`TRoute`\[`"matches"`\]\>\> | Returns a loader's promise by name. Defaults to the unnamed loader. |
