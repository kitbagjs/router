# Errors: PayloadValueError

A payload value that could not be written into the payload or read back out. Reported rather than
thrown: the value is left out and its getter runs again on the client.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new PayloadValueError(
   action, 
   kind, 
   name, 
   cause
): PayloadValueError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | `"stringify"` \| `"parse"` |
| `kind` | `DataKind` |
| `name` | `string` |
| `cause` | `unknown` |

#### Returns

`PayloadValueError`

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
