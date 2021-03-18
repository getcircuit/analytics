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

type PluginTrackEvent = (opts: TrackEventOptions) => MaybePromise<unknown>

type PluginTrackError = (opts: TrackErrorOptions) => MaybePromise<unknown>

type PluginIdentify = (
  opts: IdentifyOptions & { hash?: string },
) => MaybePromise<unknown>

type PluginAnonymize = (options?: AnonymizeOptions) => MaybePromise<unknown>

type PluginTrackPageview = (opts: PageviewOptions) => MaybePromise<unknown>

type PluginInitialize = () => MaybePromise<unknown>

type PluginDestroy = () => MaybePromise<unknown>

type ServiceMethods = {
  initialize: PluginInitialize
  destroy?: PluginDestroy
  error?: PluginTrackError
  pageview?: PluginTrackPageview
  event?: PluginTrackEvent
  identify?: PluginIdentify
  anonymize?: PluginAnonymize
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
