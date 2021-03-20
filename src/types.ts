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

export type IdentifyOptions = {
  id?: string
  fullName?: string
  [key: string]: unknown
}

export type PluginMethods = {
  load: () => MaybePromise<unknown>
  unload?: () => MaybePromise<unknown>
  error?: (opts: TrackErrorOptions) => MaybePromise<unknown>
  pageview?: (opts: PageviewOptions) => MaybePromise<unknown>
  event?: (opts: TrackEventOptions) => MaybePromise<unknown>
  identify?: (opts: IdentifyOptions) => MaybePromise<unknown>
  anonymize?: () => MaybePromise<unknown>
}

export type Plugin<PluginName extends string = string> = {
  name: PluginName
} & PluginMethods

export type LoadedPlugin<
  PluginName extends string = string
> = Plugin<PluginName> & {
  context: {
    loaded?: boolean
    loadPromise?: Promise<unknown>
  }
}

export type SharedContext = {
  meta: {
    env?: string
    appVersion?: string
    debug?: boolean
  }
}

export type AnalyticsWrapperOptions<PluginName extends string> = {
  plugins: Array<Plugin<PluginName>>
  env?: string
  appVersion?: string
  debug?: boolean
}
