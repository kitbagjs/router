# Types: AliasTransformContext\<TParams\>

```ts
type AliasTransformContext<TParams> = object;
```

What an alias transform is given: the url that matched and the params the alias pattern parsed from it.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TParams` | `Record`\<`string`, `unknown`\> | The alias's own params, typed by the alias pattern. |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="params"></a> `params` | `TParams` | The params the alias pattern parsed from the url, typed by the alias's own params rather than the route's. |
| <a id="url"></a> `url` | `string` | The url that matched the alias. |
