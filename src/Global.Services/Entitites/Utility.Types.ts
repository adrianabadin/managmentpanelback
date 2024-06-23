export type NoUndefined<T extends any|undefined> = T extends undefined ? never :T
export type ElementFromArray<T extends any[]>= T extends Array<infer U> ? U :T
