import type {
  AnalyticsWrapperOptions,
  PageviewOptions,
  TrackEventOptions,
  ServicePlugin,
} from '../types'
import { allSettled } from './utils'

function Analytics<PluginId extends string>(
  options: AnalyticsWrapperOptions<PluginId>,
) {
  type PluginIds = PluginId[]
  const { plugins } = options

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

        return plugin.identify(user)
      }),
    )
  }

  function loadServices() {
    return allSettled(plugins.map((plugin) => plugin.load()))
  }

  function unloadServices() {
    return allSettled(plugins.map((plugin) => plugin.unload?.()))
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
