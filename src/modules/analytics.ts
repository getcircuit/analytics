import type {
  SharedContext,
  AnalyticsWrapperOptions,
  PageviewOptions,
  TrackEventOptions,
  LoadedPlugin,
  PluginMethods,
} from '../types'
import { allSettled } from './utils'

type TrackMethodOptions<Plugins = string[]> = {
  include?: Plugins
  exclude?: Plugins
}

function Analytics<PluginName extends string>(
  options: AnalyticsWrapperOptions<PluginName>,
) {
  type PluginNames = PluginName[]

  const sharedContext: SharedContext = {
    meta: {
      debug: options.debug,
      appVersion: options.appVersion,
      env: options.env,
    },
  }

  // initiate all plugins with the current context
  const plugins = options.plugins.map((pluginImplementation) => {
    const plugin = pluginImplementation as LoadedPlugin<PluginName>

    plugin.context = {
      loaded: false,
      loadPromise: undefined,
    }

    return Object.freeze(plugin) as LoadedPlugin<PluginName>
  })

  /** Execute a method in all supported plugins */
  function exec<Name extends keyof PluginMethods>(
    methodName: Name,
    args: unknown,
    { include, exclude }: TrackMethodOptions = {},
  ) {
    return allSettled(
      plugins.map(async (plugin) => {
        const method = plugin[methodName]

        if (
          typeof method !== 'function' ||
          include?.includes(plugin.name) === false ||
          exclude?.includes(plugin.name) === true
        ) {
          return
        }

        if (!plugin.context.loaded) await loadService(plugin)

        // @ts-expect-error - Bleh
        return method.call(sharedContext, args)
      }),
    )
  }

  function event(
    eventArgs: TrackEventOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending event: ${JSON.stringify(eventArgs)}`)
    }

    return exec('event', eventArgs, trackingOptions)
  }

  function pageview(
    args?: PageviewOptions | null,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    const pageviewArgs = {
      page: document.location.pathname,
      ...args,
    }

    // istanbul ignore next
    if (options.debug) {
      console.info(`Sending pageview: ${JSON.stringify(pageviewArgs)}`)
    }

    return exec('pageview', pageviewArgs, trackingOptions)
  }

  function identify(
    user: Record<string, unknown>,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    // istanbul ignore next
    if (options.debug) {
      console.info(`Identifying user: ${JSON.stringify(user)}`)
    }

    return exec('identify', user, trackingOptions)
  }

  function loadService(plugin: LoadedPlugin) {
    if (plugin.context.loadPromise == null && !plugin.context.loaded) {
      plugin.context.loadPromise = Promise.resolve(
        plugin.load.call(sharedContext),
      ).then(() => {
        plugin.context.loaded = true
        plugin.context.loadPromise = undefined
      })
    }

    return Promise.resolve(plugin.context.loadPromise)
  }

  function unloadService(plugin: LoadedPlugin) {
    plugin.context.loaded = false
    plugin.context.loadPromise = undefined

    return Promise.resolve(plugin.unload?.call(sharedContext))
  }

  function loadServices() {
    return allSettled(plugins.map((plugin) => loadService(plugin)))
  }

  function unloadServices() {
    return allSettled(plugins.map((plugin) => unloadService(plugin)))
  }

  return {
    plugins: plugins.reduce(
      (acc, plugin) => {
        acc[plugin.name as PluginName] = plugin

        return acc
      },
      {} as {
        [key in PluginName]: LoadedPlugin<key>
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
