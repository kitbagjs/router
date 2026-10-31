import type { LinkBase, Meta } from 'zhead'

export type TagName = 'title' | 'meta' | 'link'

export type TagElement = Readonly<{
  tag: TagName,
  attributes: Readonly<Partial<Record<string, string>>>,
  textContent?: string,
}>

/** Supplied attributes narrow a match; omitted attributes do not constrain it. */
export type TagSelector = Readonly<{
  tag: TagName,
  attributes: Readonly<Partial<Record<string, string>>>,
}>

/** A primary tag retains its related descriptor tree until rendering. */
export type TagGroup = | Readonly<TagSelector & {
  tag: 'title',
  value: string,
}>
| Readonly<TagSelector & {
  tag: 'meta',
  value: ResolvedMetaTag,
}>
| Readonly<TagSelector & {
  tag: 'link',
  value: ResolvedLinkTag,
}>

export type TagOperation = | Readonly<{
  kind: 'set' | 'add',
  target: TagSelector,
  groups: readonly TagGroup[],
}>
| Readonly<{
  kind: 'delete',
  target: TagSelector,
}>

/** Operations are retained instead of a flattened head so removing a layer reveals current lower values. */
export type TagLayer = readonly TagOperation[]

export type MetaTagIdentifier = | {
  name: NonNullable<Meta['name']>,
  property?: never,
}
| {
  property: NonNullable<Meta['property']>,
  name?: never,
}

export type MetaTagSelector = MetaTagIdentifier & Pick<Meta, 'media' | 'id'> & {
  key?: string,
}

export type MetaTag = MetaTagSelector & Pick<Meta, 'content'> & {
  content: NonNullable<Meta['content']>,
  related?: readonly MetaTag[],
}

export type LinkTagSelector = Pick<LinkBase, 'type' | 'sizes' | 'media' | 'hreflang' | 'href' | 'id'> & {
  rel: NonNullable<LinkBase['rel']>,
  key?: string,
}

export type LinkTag = LinkBase & LinkTagSelector & {
  href: string,
  related?: readonly LinkTag[],
}

export type ResolvedMetaTag = Readonly<MetaTagIdentifier> & Readonly<Omit<MetaTag, 'name' | 'property' | 'related'>> & {
  readonly related?: readonly ResolvedMetaTag[],
}

export type ResolvedLinkTag = Readonly<Omit<LinkTag, 'related'>> & {
  readonly related?: readonly ResolvedLinkTag[],
}

export type TagsSnapshot = Readonly<{
  title: string | undefined,
  meta: readonly ResolvedMetaTag[],
  link: readonly ResolvedLinkTag[],
}>

export type Tags = {
  get: () => Promise<TagsSnapshot>,
  title: {
    get: () => Promise<string | undefined>,
    set: (value: string) => void,
    delete: () => void,
  },
  meta: {
    get: (selector?: MetaTagSelector) => Promise<readonly ResolvedMetaTag[]>,
    set: (descriptor: MetaTag) => void,
    add: (descriptor: MetaTag) => void,
    delete: (selector: MetaTagSelector) => void,
  },
  link: {
    get: (selector?: LinkTagSelector) => Promise<readonly ResolvedLinkTag[]>,
    set: (descriptor: LinkTag) => void,
    add: (descriptor: LinkTag) => void,
    delete: (selector: LinkTagSelector) => void,
  },
}
