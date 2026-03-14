# Types: RouteRedirects\<TRoute\>

```ts
type RouteRedirects<TRoute> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoute` *extends* [`Route`](Route.md) | [`Route`](Route.md) |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="redirectfrom"></a> `redirectFrom` | `RouteRedirectFrom`\<`TRoute`\> | Creates a redirect to redirect to the current route from another route. |
| <a id="redirectto"></a> `redirectTo` | `RouteRedirectTo`\<`TRoute`\> | Creates a redirect to redirect the current route to another route. |
