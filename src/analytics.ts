import type {
  TraceOptions,
  PluginContext,
  AnalyticsWrapperOptions,
  PageviewOptions,
  TrackEventOptions,
  InitializedPlugin,
  PluginHooks,
  IdentifyOptions,
  GenericObject,
} from './types'
import { allSettled, getHookAssertionHelpers } from './modules/utils'

type TrackMethodOptions<Plugins = string[]> = {
  include?: Plugins
  exclude?: Plugins
}

function Analytics<PluginName extends string>({
  debug,
  appVersion,
  env,
  dryRun,
  explicitUse,
  plugins: pluginImplementations,
}: AnalyticsWrapperOptions<PluginName>) {
  type PluginNames = PluginName[]

  const shouldTrack = !dryRun
  const configContext = {
    debug,
    appVersion,
    env,
  }

  const plugins = pluginImplementations.map(({ name, ...hooks }) => {
    const plugin = {
      name,
      loaded: false,
      loadPromise: undefined,
      hooks,
    } as InitializedPlugin<PluginName>

    return plugin
  })

  // istanbul ignore next
  if (debug) {
    console.debug(
      [
        '[Analytics]',
        '',
        `Plugins: "${plugins.map((pl) => pl.name).join('", "')}"`,
        `Env: "${env}"`,
        `Tracking ${shouldTrack ? 'enabled' : 'disabled'}.`,
      ].join('\n'),
    )
  }

  function runPluginHook(
    plugin: InitializedPlugin,
    hook: keyof PluginHooks,
    args?: GenericObject,
  ) {
    const pluginContext: PluginContext = {
      config: configContext,
      ...getHookAssertionHelpers(plugin.name, hook),
    }

    // We do a shallow clone because a hook may change the object
    // @ts-expect-error - TS doesn't connect the passed args to the method we're executing
    return plugin.hooks[hook]?.call(pluginContext, { ...args })
  }

  /** Execute a hook in all supported plugins */
  function runHook<Hook extends keyof Omit<PluginHooks, 'load' | 'unload'>>(
    hook: Hook,
    args: GenericObject | undefined,
    { include, exclude }: TrackMethodOptions,
  ) {
    const relevantPlugins = plugins.filter((plugin) => {
      if (include?.includes(plugin.name) === false) return false
      if (exclude?.includes(plugin.name) === true) return false
      if (
        explicitUse?.[hook]?.includes(plugin.name) &&
        !include?.includes(plugin.name)
      ) {
        return false
      }

      if (typeof plugin.hooks[hook] === 'function') {
        return true
      }

      return false
    })

    // istanbul ignore next
    if (debug) {
      console.debug(
        [
          '[Analytics]',
          '',
          `Hook: "${hook}"`,
          `Args: ${JSON.stringify(args)}`,
          `Plugins: "${relevantPlugins.map((pl) => pl.name).join('", "')}"`,
        ].join('\n'),
      )
    }

    // istanbul ignore next
    if (shouldTrack === false) return Promise.resolve()

    return allSettled(
      relevantPlugins.map(async (plugin) => {
        if (!plugin.loaded) await loadService(plugin)

        return runPluginHook(plugin, hook, args)
      }),
    )
  }

  function event(
    eventArgs: TrackEventOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    return runHook('event', eventArgs, trackingOptions)
  }

  function pageview(
    args?: PageviewOptions | null,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    const pageviewArgs = {
      page: document.location.pathname,
      location: document.location.href,
      title: document.title,
      ...args,
    }

    return runHook('pageview', pageviewArgs, trackingOptions)
  }

  function identify(
    user: IdentifyOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    return runHook('identify', user, trackingOptions)
  }

  function anonymize(trackingOptions: TrackMethodOptions<PluginNames> = {}) {
    return runHook('anonymize', undefined, trackingOptions)
  }

  function error(
    traceOptions: TraceOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    return runHook('error', traceOptions, trackingOptions)
  }

  function warn(
    traceOptions: TraceOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    return runHook('warn', traceOptions, trackingOptions)
  }

  function info(
    traceOptions: TraceOptions,
    trackingOptions: TrackMethodOptions<PluginNames> = {},
  ) {
    return runHook('info', traceOptions, trackingOptions)
  }

  function loadService(plugin: InitializedPlugin) {
    if (plugin.loadPromise == null && !plugin.loaded) {
      plugin.loadPromise = Promise.resolve(runPluginHook(plugin, 'load')).then(
        () => {
          plugin.loaded = true
          plugin.loadPromise = undefined
        },
      )
    }

    return Promise.resolve(plugin.loadPromise)
  }

  function unloadService(plugin: InitializedPlugin) {
    plugin.loaded = false
    plugin.loadPromise = undefined

    return Promise.resolve(runPluginHook(plugin, 'unload'))
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
        [Key in PluginName]: InitializedPlugin<Key>
      },
    ),
    loadServices,
    unloadServices,
    event,
    pageview,
    identify,
    error,
    warn,
    info,
    anonymize,
  }
}

export { Analytics }
