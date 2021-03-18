import { createPlugins, destroyPlugin, initializePlugin } from './plugin'
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
  const plugins = createPlugins(options.services)

  function event(
    eventOptions: TrackEventOptions,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
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

        return plugin.event(eventOptions)
      }),
    )
  }

  function pageview(
    pageviewOptions?: PageviewOptions | null,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
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

        return plugin.pageview({
          page: document.location.pathname,
          ...pageviewOptions,
        })
      }),
    )
  }

  function identify(
    user: unknown,
    { services }: { services?: Record<string, unknown> } = {},
  ) {
    const userOptions = options.parseUser?.(user) ?? (user as IdentifyOptions)

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

        return plugin.identify(userOptions)
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
