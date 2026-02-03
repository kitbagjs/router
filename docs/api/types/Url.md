# Types: Url\<TParams\>

```ts
type Url<TParams> = object;
```

Represents the structure of a url parts. Can be used to create a url with support for params.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TParams` *extends* `UrlParams` | `UrlParams` |

## Methods

### parse()

```ts
parse(url): Identity<MakeOptional<{ [K in string | number | symbol]: TParams[K] extends OptionalParam<TParam> ? TParam extends Required<ParamGetSet> ? ExtractParamType<TParam<TParam>> : ExtractParamType<TParam> | undefined : TParams[K] extends RequiredParam<TParam> ? ExtractParamType<TParam> : unknown }>>;
```

Parses the url supplied and returns any params found.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

#### Returns

`Identity`\<`MakeOptional`\<\{ \[K in string \| number \| symbol\]: TParams\[K\] extends OptionalParam\<TParam\> ? TParam extends Required\<ParamGetSet\> ? ExtractParamType\<TParam\<TParam\>\> : ExtractParamType\<TParam\> \| undefined : TParams\[K\] extends RequiredParam\<TParam\> ? ExtractParamType\<TParam\> : unknown \}\>\>

***

### stringify()

```ts
stringify(...params): UrlString;
```

Converts the url parts to a full url.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| ...`params` | `UrlParamsArgs`\<`TParams`\> |

#### Returns

[`UrlString`](UrlString.md)

***

### tryParse()

```ts
tryParse(url): 
  | {
  params: ToUrlParamsReading<TParams>;
  success: true;
}
  | {
  error: Error;
  params: {
  };
  success: false;
};
```

Parses the url supplied and returns any params found.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` |

#### Returns

  \| \{
  `params`: `ToUrlParamsReading`\<`TParams`\>;
  `success`: `true`;
\}
  \| \{
  `error`: `Error`;
  `params`: \{
  \};
  `success`: `false`;
\}

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="is_url_symbol"></a> `[IS_URL_SYMBOL]` | `true` | **`Internal`** Symbol to identify if the url is a valid url. |
| <a id="isrelative"></a> `isRelative` | `boolean` | True if the url is relative. False if the url is absolute. |
| <a id="params"></a> `params` | `TParams` | **`Internal`** The parameters type for the url. Non functional and undefined at runtime. |
