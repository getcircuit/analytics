import type { ServicePlugin, Service, ServiceTrackMethod } from './types'

type PluginCommonOptions = {
  explicitUseOnly?: ServiceTrackMethod[]
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function createPlugin<Id extends string, Options = {}>(
  id: Id,
  factory: (options: Options) => Service,
) {
  return (options: Options & PluginCommonOptions = {} as Options) => {
    const service = factory(options)

    if (options?.explicitUseOnly) {
      service.explicitUseOnly = options.explicitUseOnly
    }

    const plugin = service as ServicePlugin

    plugin.id = id
    plugin.ctx = {
      loaded: false,
      loadPromise: undefined,
    }

    return Object.freeze(plugin) as ServicePlugin<Id>
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
