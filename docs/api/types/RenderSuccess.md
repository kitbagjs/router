# Types: RenderSuccess

```ts
type RenderSuccess = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="failures"></a> `failures` | [`PayloadValueError`](../errors/PayloadValueError.md)[] | Values that could not be encoded into the payload. Each was left out, so the client computes it again, which can cause a hydration mismatch. Returned so a server can log or inspect them. |
| <a id="kind"></a> `kind` | `"success"` | - |
| <a id="payload"></a> `payload` | `string` | A script tag to embed in the document sent to the client, so it adopts what this render settled on rather than working it out again. |
| <a id="status"></a> `status` | `number` | Suggested http status. |
| <a id="title"></a> `title` | `string` \| `undefined` | The title of the route that rendered, for the document sent to the client. |
