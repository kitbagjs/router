# Functions: isUrlWithSchema()

```ts
function isUrlWithSchema(url): url is Url<UrlParams> & { schema: Record<string, UrlPart> };
```

**`Internal`**

Type guard to assert that a url has a schema.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `unknown` |

## Returns

`url is Url<UrlParams> & { schema: Record<string, UrlPart> }`
