# Errors: RouterNotInstalledError

An error thrown when an attempt is made to use routing functionality before the router has been installed.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new RouterNotInstalledError(): RouterNotInstalledError;
```

#### Returns

`RouterNotInstalledError`

#### Overrides

```ts
Error.constructor
```

## Methods

### isError()

```ts
static isError(error): error is Error;
```

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |

#### Returns

`error is Error`

#### Inherited from

```ts
Error.isError
```

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| <a id="cause"></a> `cause?` | `unknown` | `Error.cause` |
| <a id="message"></a> `message` | `string` | `Error.message` |
| <a id="name"></a> `name` | `string` | `Error.name` |
| <a id="stack"></a> `stack?` | `string` | `Error.stack` |
