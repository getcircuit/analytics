export type MaybePromise<T = unknown> = Promise<T> | T

export type GenericObject<Values = unknown> = Record<string, Values>

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
  externalId?: string
  email?: string
  phone?: string | null
  name?: string | null
  fullName?: string | null
  displayName?: string | null
  [key: string]: unknown
}

export type TraceOptions = {
  message: string
  [key: string]: unknown
}

export type PluginHooks = {
  load: (this: PluginContext) => MaybePromise
  unload?: (this: PluginContext) => MaybePromise
  pageview?: (this: PluginContext, opts: PageviewOptions) => MaybePromise
  event?: (this: PluginContext, opts: TrackEventOptions) => MaybePromise
  identify?: (this: PluginContext, opts: IdentifyOptions) => MaybePromise
  anonymize?: (this: PluginContext) => MaybePromise
  info?: (this: PluginContext, opts: TraceOptions) => MaybePromise
  warn?: (this: PluginContext, opts: TraceOptions) => MaybePromise
  error?: (this: PluginContext, opts: TraceOptions) => MaybePromise
}

export type Plugin<PluginName extends string = string> = {
  name: PluginName
} & PluginHooks

export type InitializedPlugin<PluginName extends string = string> = {
  name: PluginName
  hooks: PluginHooks
  loaded: boolean
  loadPromise?: Promise<unknown>
}

export type ConfigContext = {
  env?: string
  appVersion?: string
  debug?: boolean
}

export type PluginContext = {
  config: ConfigContext
  /** Asserts that an object has received certain props */
  assertKeys: <T extends GenericObject>(value: T, props: Array<keyof T>) => void
  /** Asserts that every passed value is truthy */
  assertValues: (values: GenericObject) => void
}

export type AnalyticsWrapperOptions<PluginName extends string> = {
  env?: string
  appVersion?: string
  plugins: Array<Plugin<PluginName>>
  debug?: boolean
  trackWhenEnv?: string
  explicitUse?: {
    [key in keyof Omit<PluginHooks, 'load' | 'unload'>]: PluginName[]
  }
}
