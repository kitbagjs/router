# Functions: useRouter()

```ts
function useRouter(): RegisteredRouter
```

A composition to access the registered router instance within a Vue component.

## Returns

[`RegisteredRouter`](../types/RegisteredRouter.md)

The registered router instance.

## Throws

Throws an error if the router has not been installed,
        ensuring the component does not operate without routing functionality.
