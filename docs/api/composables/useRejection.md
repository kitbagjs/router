# useRejection

```ts
function useRejection(): RouterRejection
```

A composition to access the router's rejection state.

## Returns

`RouterRejection`

The rejection state object from the router, which can be used to handle route rejections such as authentication failures or permission denials.

## Throws

Throws an error if the router's rejection state is not available, typically indicating that createRouter was never called.
