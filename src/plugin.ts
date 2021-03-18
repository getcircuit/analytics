import type { ServicePlugin, Service, ServiceTrackMethod } from './types'

type PluginCommonOptions = {
  explicitUseOnly?: ServiceTrackMethod[]
}

export function createPlugin<T>(factory: (options: T) => Service) {
  return (options: T & PluginCommonOptions = {} as T) => {
    const service = factory(options)

    if (options?.explicitUseOnly) {
      service.explicitUseOnly = options.explicitUseOnly
    }

    return service
  }
}

export function getServicePlugins<T extends Record<string, Service>>(
  services: T,
) {
  return Object.entries(services).map(([id, service]) => {
    const plugin = service as ServicePlugin

    plugin.id = id
    plugin.ctx = {
      loaded: false,
      loadPromise: undefined,
    }

    return Object.freeze(plugin)
  })
}

export function initializePlugin(plugin: ServicePlugin) {
  if (plugin.ctx.loadPromise == null && !plugin.ctx.loaded) {
    plugin.ctx.loadPromise = Promise.resolve(plugin.initialize()).then(() => {
      plugin.ctx.loaded = true
      plugin.ctx.loadPromise = undefined
    })
  }

  return plugin.ctx.loadPromise
}

export function destroyPlugin(plugin: ServicePlugin) {
  plugin.ctx.loaded = false
  plugin.ctx.loadPromise = undefined

  return plugin.destroy?.()
}
