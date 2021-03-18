import { getServicePlugins, destroyPlugin, initializePlugin } from './plugin'
import type {
  AnalyticsWrapperOptions,
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
  Service,
  ServicePlugin,
} from './types'

function Analytics<ServiceMap extends Record<string, Service>>(
  options: AnalyticsWrapperOptions<ServiceMap>,
) {
  const plugins = getServicePlugins(options.services)

  function event(
    eventArgs: TrackEventOptions,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
    if (options.debug) {
      console.info(`Sending event: ${JSON.stringify(eventArgs)}`)
    }

    return Promise.allSettled(
      plugins.map(async (plugin) => {
        if (plugin.event == null || services?.[plugin.id] === false) return
        if (
          plugin.explicitUseOnly?.includes('event') &&
          services?.[plugin.id] !== true
        ) {
          return
        }

        // istanbul ignore else
        if (!plugin.ctx.loaded) await initializePlugin(plugin)

        return plugin.event(eventArgs)
      }),
    )
  }

  function pageview(
    args?: PageviewOptions | null,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
    const pageviewArgs = {
      page: document.location.pathname,
      ...args,
    }

    if (options.debug) {
      console.info(`Sending pageview: ${JSON.stringify(pageviewArgs)}`)
    }

    return Promise.allSettled(
      plugins.map(async (plugin) => {
        if (plugin.pageview == null || services?.[plugin.id] === false) return
        if (
          plugin.explicitUseOnly?.includes('pageview') &&
          services?.[plugin.id] !== true
        ) {
          return
        }

        // istanbul ignore else
        if (!plugin.ctx.loaded) await initializePlugin(plugin)

        return plugin.pageview(pageviewArgs)
      }),
    )
  }

  function identify(
    user: unknown,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
    const userArgs = options.parseUser?.(user) ?? (user as IdentifyOptions)

    if (options.debug) {
      console.info(`Identifying user: ${JSON.stringify(userArgs)}`)
    }

    return Promise.allSettled(
      plugins.map(async (plugin) => {
        if (plugin.identify == null || services?.[plugin.id] === false) return
        if (
          plugin.explicitUseOnly?.includes('identify') &&
          services?.[plugin.id] !== true
        ) {
          return
        }

        // istanbul ignore else
        if (!plugin.ctx.loaded) await initializePlugin(plugin)

        return plugin.identify(userArgs)
      }),
    )
  }

  function initialize() {
    return Promise.allSettled(plugins.map(initializePlugin))
  }

  function destroy() {
    return Promise.allSettled(plugins.map(destroyPlugin))
  }

  return Object.freeze({
    services: plugins.reduce((acc, plugin) => {
      acc[plugin.id as keyof ServiceMap] = plugin

      return acc
    }, {} as Record<keyof ServiceMap, ServicePlugin>),
    initialize,
    destroy,
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
