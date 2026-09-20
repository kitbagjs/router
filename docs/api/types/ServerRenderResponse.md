# Types: ServerRenderResponse

```ts
type ServerRenderResponse = 
  | RenderSuccess
  | RenderReject
  | RenderRedirect;
```

What a server should respond with for what the router rendered. `location` exists only on a redirect,
so narrowing on it is what proves a `Location` header is available.
