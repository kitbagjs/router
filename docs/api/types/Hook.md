# Types: Hook\<TContext\>

```ts
type Hook<TContext> = object;
```

A reusable hook that can be attached before or after a route enters, updates, or leaves.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TContext` *extends* readonly `RouteContext`[] | \[\] |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="context"></a> `context` | `TContext` |
| <a id="hook"></a> `hook` | `AnyFunction`\<`MaybePromise`\<`void`\>\> |
