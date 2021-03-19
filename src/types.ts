import type { TRACK_METHODS } from './modules/plugin'

export type MaybePromise<T> = Promise<T> | T

export type TrackEventOptions = {
  label: string
  [key: string]: unknown
}

export type PageviewOptions = {
  page: string
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
  fullName?: string
  [key: string]: unknown
}

export type ServiceMethods = {
  load: () => MaybePromise<unknown>
  unload?: () => MaybePromise<unknown>
  error?: (opts: TrackErrorOptions) => MaybePromise<unknown>
  pageview?: (opts: PageviewOptions) => MaybePromise<unknown>
  event?: (opts: TrackEventOptions) => MaybePromise<unknown>
  identify?: (opts: IdentifyOptions) => MaybePromise<unknown>
  anonymize?: (options?: AnonymizeOptions) => MaybePromise<unknown>
} & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any
}

export type Service = ServiceMethods & {
  explicitUseOnly?: Array<typeof TRACK_METHODS[number]>
}

export type ServicePlugin<Id extends string = string> = Service & {
  id: Id
  ctx: {
    loaded?: boolean
    loadPromise?: Promise<unknown>
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type PluginOptions<Options extends Object> = Options & {
  explicitUseOnly?: Array<typeof TRACK_METHODS[number]>
}

export type PluginImplementation<Options> = (
  options: Options,
  context: AnalyticsWrapperContext,
) => ServiceMethods

export type PluginInitiator<Id extends string> = (
  ctx: AnalyticsWrapperContext,
) => ServicePlugin<Id>

// eslint-disable-next-line @typescript-eslint/ban-types
export type PluginFactory<Id extends string, Options = {}> = (
  options?: PluginOptions<Options>,
) => PluginInitiator<Id>

export type AnalyticsWrapperContext = {
  appVersion?: string
  debug?: boolean
}

export type AnalyticsWrapperOptions<Id extends string> = {
  plugins: Array<PluginInitiator<Id>>
} & AnalyticsWrapperContext
