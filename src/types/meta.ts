type EmptyMeta = Readonly<{}>

export type ToMeta<TMeta extends Record<string, unknown> | undefined> = TMeta extends undefined
  ? EmptyMeta
  : unknown extends TMeta
    ? EmptyMeta
    : TMeta
