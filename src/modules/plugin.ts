import type { ServiceMethods, ServicePlugin } from '../types'

export const TRACK_METHODS = [
  'event',
  'pageview',
  'identify',
  'anonymize',
  'error',
] as const

type PluginCommonOptions = {
  explicitUseOnly?: Array<typeof TRACK_METHODS[number]>
}
// eslint-disable-next-line @typescript-eslint/ban-types
export function createPlugin<Id extends string, Options = {}>(
  id: Id,
  getPluginMethods: (
    this: ServicePlugin<Id>,
    options: Options,
  ) => ServiceMethods,
) {
  return (options: Options & PluginCommonOptions = {} as Options) => {
    const plugin = {
      id,
      explicitUseOnly: options.explicitUseOnly,
      ctx: {
        loaded: false,
        loadPromise: undefined,
      },
    } as ServicePlugin<Id>

    const pluginMethods = getPluginMethods.call(plugin, options)

    plugin.load = () => {
      if (plugin.ctx.loadPromise == null && !plugin.ctx.loaded) {
        plugin.ctx.loadPromise = Promise.resolve(pluginMethods.load()).then(
          () => {
            plugin.ctx.loaded = true
            plugin.ctx.loadPromise = undefined
          },
        )
      }

      return Promise.resolve(plugin.ctx.loadPromise)
    }

    // istanbul ignore else
    if (pluginMethods.unload) {
      plugin.unload = () => {
        plugin.ctx.loaded = false
        plugin.ctx.loadPromise = undefined

        return Promise.resolve(pluginMethods.unload?.())
      }
    }

    // wraps tracking methods so all of them awaits the service script to load
    TRACK_METHODS.forEach((method) => {
      if (pluginMethods[method] == null) return

      plugin[method] = async (...args: unknown[]) => {
        if (!plugin.ctx.loaded) await plugin.load()

        // @ts-expect-error - Just passing args through
        return pluginMethods[method](args)
      }
    })

    return Object.freeze(plugin)
  }
}
