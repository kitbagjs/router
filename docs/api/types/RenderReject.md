# Types: RenderReject

```ts
type RenderReject = object;
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `"reject"` | - |
| <a id="payload"></a> `payload` | `string` | A script tag to embed in the document sent to the client, so it adopts this rejection rather than working it out again. |
| <a id="rejection"></a> `rejection` | `string` | The type of rejection in effect. |
| <a id="status"></a> `status` | `number` | Suggested http status. |
| <a id="title"></a> `title` | `string` \| `undefined` | The title of the rejection that rendered, for the document sent to the client. |
