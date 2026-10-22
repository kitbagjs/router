# Errors: LoaderDataAccessError

An error thrown when a loader reads the data of the route it belongs to. That data includes what the
loader itself is computing, so reading it could only wait on the loader that is doing the reading.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new LoaderDataAccessError(name?): LoaderDataAccessError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name?` | `string` |

#### Returns

`LoaderDataAccessError`

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
