# Types: CreateHookOptions\<TContext, TRoutes\>

```ts
type CreateHookOptions<TContext, TRoutes> = object;
```

Options for a reusable route hook.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |
| `TRoutes` *extends* `Routes` | `Routes` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="context"></a> `context?` | `TContext` | See [Context](https://kitbag-router.netlify.app/advanced-concepts/context). |
| <a id="hook"></a> `hook` | (`route`, `context`) => `MaybePromise`\<`void`\> | - |
