# Types: UrlParamsWriting\<TUrl\>

```ts
type UrlParamsWriting<TUrl> = ToUrlParamsWriting<TUrl["params"]>;
```

Extracts combined types of path and query parameters for a given url, creating a unified parameter object.
Differs from ExtractRouteParamTypesReading in that optional params with defaults will remain optional.

## Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `TUrl` *extends* [`Url`](Url.md) | The url type from which to extract and merge parameter types. |

## Returns

A record of parameter names to their respective types, extracted and merged from both path and query parameters.
