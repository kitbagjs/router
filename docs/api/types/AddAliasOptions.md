# Types: AddAliasOptions

```ts
type AddAliasOptions = object;
```

The url an alias matches, in the same shapes `createRoute` takes. An alias declares its whole url:
nothing is taken from the route's own path, query, or hash.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="hash"></a> `hash?` | `string` \| `UrlPart` | Hash part of the alias. |
| <a id="path"></a> `path?` | `string` \| `UrlPart` | Path part of the alias. |
| <a id="query"></a> `query?` | `string` \| `UrlQueryPart` | Query (aka search) part of the alias. |
