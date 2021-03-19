type MaybePromise<T> = Promise<T> | T

export type TrackEventOptions = {
  label: string
  [key: string]: unknown
}

export type PageviewOptions = {
  page?: string
  location?: string
  title?: string
}

export type TrackErrorOptions = {
  error: string
  [key: string]: unknown
}

export type AnonymizeOptions = {
  anonymousId?: string
}

export type IdentifyOptions = {
  id?: string
  uid?: string
  phone?: string
  userId?: string
  distinctId?: string
  displayName?: string
  fullName?: string
  name?: string
  email?: string
  [key: string]: unknown
}

type ServiceMethods = {
  load: () => MaybePromise<unknown>
  unload?: () => MaybePromise<unknown>
  error?: (opts: TrackErrorOptions) => MaybePromise<unknown>
  pageview?: (opts?: PageviewOptions | null) => MaybePromise<unknown>
  event?: (opts: TrackEventOptions) => MaybePromise<unknown>
  identify?: (opts: IdentifyOptions) => MaybePromise<unknown>
  anonymize?: (options?: AnonymizeOptions) => MaybePromise<unknown>
}

export type ServiceTrackMethod = keyof Exclude<
  ServiceMethods,
  'initialize' | 'destroy'
>

export type Service = ServiceMethods & {
  explicitUseOnly?: ServiceTrackMethod[]
}

export type ServicePlugin = Service & {
  id: string
  ctx: {
    loaded?: boolean
    loadPromise?: Promise<unknown>
  }
}

export type AnalyticsWrapperOptions<T> = {
  services: T
  debug?: boolean
  /** Generate an unique id from a user */
  parseUser?: (user: unknown) => IdentifyOptions
}
