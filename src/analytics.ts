import { initializePlugin, unloadService, loadService } from './plugin'
import type {
  AnalyticsWrapperOptions,
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
  Service,
  ServicePlugin,
} from './types'

/** Quick and dirty Promise.allSettle ponyfill */
function waitAllSettled(promises: Array<Promise<unknown>>) {
  return Promise.all(promises.map((promise) => promise.catch(() => undefined)))
}

function Analytics<ServiceMap extends Record<string, Service>>(
  options: AnalyticsWrapperOptions<ServiceMap>,
) {
  type ServiceList = Array<keyof ServiceMap>

  const plugins = Object.entries(options.services).map(([id, plugin]) =>
    initializePlugin(id, plugin),
  )

  function event(
    eventArgs: TrackEventOptions,
    { services }: { services?: ServiceList } = {},
  ) {
    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending event: ${JSON.stringify(eventArgs)}`)
    }

    return waitAllSettled(
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
    { services }: { services?: ServiceList } = {},
  ) {
    const pageviewArgs = {
      page: document.location.pathname,
      ...args,
    }

    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending pageview: ${JSON.stringify(pageviewArgs)}`)
    }

    return waitAllSettled(
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
    user: unknown,
    { services }: { services?: ServiceList } = {},
  ) {
    const userArgs = options.parseUser?.(user) ?? (user as IdentifyOptions)

    // istanbul ignore next
    if (options.debug) {
      console.info(`Identifying user: ${JSON.stringify(userArgs)}`)
    }

    return waitAllSettled(
      plugins.map(async (plugin) => {
        if (plugin.identify == null) return
        if (services != null && !services?.includes(plugin.id)) return
        if (services == null && plugin.explicitUseOnly?.includes('identify')) {
          return
        }

        // istanbul ignore else
        if (!plugin.ctx.loaded) await loadService(plugin)

        return plugin.identify(userArgs)
      }),
    )
  }

  function loadServices() {
    return waitAllSettled(plugins.map(loadService))
  }

  function unloadServices() {
    return waitAllSettled(plugins.map(unloadService))
  }

  return Object.freeze({
    services: plugins.reduce((acc, plugin) => {
      acc[plugin.id as keyof ServiceMap] = plugin

      return acc
    }, {} as Record<keyof ServiceMap, ServicePlugin>),
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
