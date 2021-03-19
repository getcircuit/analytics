import type {
  ServicePlugin,
  PluginFactory,
  PluginImplementation,
} from '../types'

export const TRACK_METHODS = [
  'event',
  'pageview',
  'identify',
  'anonymize',
  'error',
] as const

// eslint-disable-next-line @typescript-eslint/ban-types
export function createPlugin<Id extends string, Options = {}>(
  id: Id,
  getPluginImplementation: PluginImplementation<Options>,
): PluginFactory<Id, Options> {
  return (opts) => {
    const { explicitUseOnly, ...options } = opts ?? {}

    return (context) => {
      const plugin = {
        id,
        explicitUseOnly,
        ctx: {
          loaded: false,
          loadPromise: undefined,
        },
        ...getPluginImplementation(options as Options, context),
      } as ServicePlugin<Id>

      return Object.freeze(plugin) as ServicePlugin<Id>
    }
  }
}

export function loadService(plugin: ServicePlugin) {
  if (plugin.ctx.loadPromise == null && !plugin.ctx.loaded) {
    plugin.ctx.loadPromise = Promise.resolve(plugin.load()).then(() => {
      plugin.ctx.loaded = true
      plugin.ctx.loadPromise = undefined
    })
  }

  return Promise.resolve(plugin.ctx.loadPromise)
}

export function unloadService(plugin: ServicePlugin) {
  plugin.ctx.loaded = false
  plugin.ctx.loadPromise = undefined

  return Promise.resolve(plugin.unload?.())
}
