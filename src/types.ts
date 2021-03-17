export type PluginTrack = (args: {
  payload: { event: string; properties?: Record<string, unknown> }
}) => Promise<void>

export type PluginIdentify = (args: {
  payload: { userId?: string | null; anonymousId?: string; traits?: unknown }
}) => Promise<void>

export type PluginAnonymize = (args?: { anonymousId?: string }) => Promise<void>

export type PluginPage = (args: {
  payload: { url: string; properties?: Record<string, unknown> }
}) => Promise<void>

export type PluginInitialize = () => Promise<void>

export type ServicePlugin = {
  initialize: PluginInitialize
  page?: PluginPage
  track?: PluginTrack
  identify?: PluginIdentify
  anonymize?: PluginAnonymize
  loaded?: boolean
}

export type ServicePluginFactory<T> = (opts: T) => ServicePlugin

export type AnalyticsWrapperOptions = {
  services: Record<string, ServicePlugin>
  debug?: boolean
}
