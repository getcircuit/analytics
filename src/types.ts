export type MaybePromise<T = unknown> = Promise<T> | T

export type TrackEventOptions = {
  label: string
  [key: string]: unknown
}

export type PageviewOptions = {
  page: string
  location?: string
  title?: string
}

export type IdentifyOptions = {
  id?: string
  fullName?: string
  email?: string
  name?: string
  [key: string]: unknown
}

export type TraceOptions = {
  message: string
  [key: string]: unknown
}

export type PluginHooks = {
  pageview?: (opts: PageviewOptions) => MaybePromise
  event?: (opts: TrackEventOptions) => MaybePromise
  identify?: (opts: IdentifyOptions) => MaybePromise
  anonymize?: () => MaybePromise
  info?: (opts: TraceOptions) => MaybePromise
  warn?: (opts: TraceOptions) => MaybePromise
  error?: (opts: TraceOptions) => MaybePromise
}

export type Plugin<PluginName extends string = string> = {
  name: PluginName
  load: () => MaybePromise
  unload?: () => MaybePromise
} & PluginHooks

export type InitializedPlugin<
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
  env?: string
  appVersion?: string
  plugins: Array<Plugin<PluginName>>
  debug?: boolean
  trackWhenEnv?: string
  explicitUse?: {
    [key in keyof PluginHooks]: PluginName[]
  }
}
