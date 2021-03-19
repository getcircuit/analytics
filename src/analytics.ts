import { unloadService, loadService } from './plugin'
import type {
  AnalyticsWrapperOptions,
  PageviewOptions,
  TrackEventOptions,
  ServicePlugin,
} from './types'
import { allSettled } from './utils'

function Analytics<PluginIds extends string>(
  options: AnalyticsWrapperOptions<PluginIds>,
) {
  const plugins = options.services

  function event(
    eventArgs: TrackEventOptions,
    { services }: { services?: PluginIds[] } = {},
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

        // istanbul ignore else
        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.event(eventArgs)
      }),
    )
  }

  function pageview(
    args?: PageviewOptions | null,
    { services }: { services?: PluginIds[] } = {},
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

        // istanbul ignore else
        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.pageview(pageviewArgs)
      }),
    )
  }

  function identify(
    user: Record<string, unknown>,
    { services }: { services?: PluginIds[] } = {},
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

        // istanbul ignore else
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

  return Object.freeze({
    services: plugins.reduce(
      (acc, plugin) => {
        acc[plugin.id as PluginIds] = plugin

        return acc
      },
      {} as {
        [key in PluginIds]: ServicePlugin<key>
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
  })
}

export { Analytics }
