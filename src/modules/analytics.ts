import type {
  AnalyticsWrapperOptions,
  PageviewOptions,
  TrackEventOptions,
  ServicePlugin,
} from '../types'
import { loadService, unloadService } from './plugin'
import { allSettled } from './utils'

function Analytics<PluginId extends string>(
  options: AnalyticsWrapperOptions<PluginId>,
) {
  type PluginIds = PluginId[]

  const context = {
    debug: options.debug,
    appVersion: options.appVersion,
  }

  // initiate all plugins with the current context
  const plugins = options.plugins.map((plugin) => plugin(context))

  function event(
    eventArgs: TrackEventOptions,
    { services }: { services?: PluginIds } = {},
  ) {
    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending event: ${JSON.stringify(eventArgs)}`)
    }

    return allSettled(
      plugins.map(async (plugin) => {
        if (plugin.event == null) return
        if (services != null && !services?.includes(plugin.id)) return
        if (services == null && plugin.explicitUseOnly?.includes('event')) {
          return
        }

        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.event(eventArgs)
      }),
    )
  }

  function pageview(
    args?: PageviewOptions | null,
    { services }: { services?: PluginIds } = {},
  ) {
    const pageviewArgs = {
      page: document.location.pathname,
      ...args,
    }

    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending pageview: ${JSON.stringify(pageviewArgs)}`)
    }

    return allSettled(
      plugins.map(async (plugin) => {
        if (plugin.pageview == null) return
        if (services != null && !services?.includes(plugin.id)) return
        if (services == null && plugin.explicitUseOnly?.includes('pageview')) {
          return
        }

        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.pageview(pageviewArgs)
      }),
    )
  }

  function identify(
    user: Record<string, unknown>,
    { services }: { services?: PluginIds } = {},
  ) {
    // istanbul ignore next
    if (options.debug) {
      console.info(`Identifying user: ${JSON.stringify(user)}`)
    }

    return allSettled(
      plugins.map(async (plugin) => {
        if (plugin.identify == null) return
        if (services != null && !services?.includes(plugin.id)) return
        if (services == null && plugin.explicitUseOnly?.includes('identify')) {
          return
        }

        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.identify(user)
      }),
    )
  }

  function loadServices() {
    return allSettled(plugins.map(loadService))
  }

  function unloadServices() {
    return allSettled(plugins.map(unloadService))
  }

  return {
    plugins: plugins.reduce(
      (acc, plugin) => {
        acc[plugin.id as PluginId] = plugin

        return acc
      },
      {} as {
        [key in PluginId]: ServicePlugin<key>
      },
    ),
    loadServices,
    unloadServices,
    event,
    pageview,
    identify,
    anonymize({ anonymousId }: { anonymousId?: string } = {}) {
      // todo: this params
      return this.identify({ userId: null, anonymousId })
    },
  }
}

export { Analytics }
