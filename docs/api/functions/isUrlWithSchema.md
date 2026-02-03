# Functions: isUrlWithSchema()

```ts
function isUrlWithSchema(url): url is Url<UrlParams> & { schema: Record<string, WithParams> };
```

**`Internal`**

Type guard to assert that a url has a schema.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `unknown` |

## Returns

`url is Url<UrlParams> & { schema: Record<string, WithParams> }`
