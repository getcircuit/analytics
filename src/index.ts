import type { AnalyticsWrapperOptions, ServicePlugin } from './types'

type AnalyticsContext = {
  plugins: Array<[string, ServicePlugin]>
  options: AnalyticsWrapperOptions
  initPromises: Record<string, Promise<void>>
}

async function track(
  { plugins, options, initPromises }: AnalyticsContext,
  {
    event,
    payload,
  }: {
    event: string
    payload?: Record<string, unknown>
  },
  { services }: { services?: Record<string, unknown> } = {},
) {
  if (process.env.NODE_ENV !== 'production' && options.debug) {
    console.info(
      `Tracking event "${event}" on: ${plugins.map(([id]) => id).join(', ')}`,
    )
    if (payload) {
      console.table(payload)
    }
  }

  return Promise.allSettled(
    plugins.map(async ([id, plugin]) => {
      if (services?.[id] === false) return

      if (!plugin.loaded) {
        if (!(id in initPromises)) {
          console.error(`Analytics plugin "${id}" was not initialized.`)

          return
        }

        await initPromises[id]
      }

      return plugin.track?.({
        payload: { event, properties: payload },
      })
    }),
  )
}

async function page(
  { plugins, options, initPromises }: AnalyticsContext,
  {
    url,
    payload,
  }: {
    url?: string
    payload?: Record<string, unknown>
  } = {},
  { services }: { services?: Record<string, unknown> } = {},
) {
  const pageviewURL = url ?? document.location.pathname

  if (process.env.NODE_ENV !== 'production' && options.debug) {
    console.info(`Sending pageview on: ${plugins.map(([id]) => id).join(', ')}`)
  }

  return Promise.allSettled(
    plugins.map(async ([id, plugin]) => {
      if (services?.[id] === false) return

      if (!plugin.loaded) {
        if (!(id in initPromises)) {
          console.error(`Analytics plugin "${id}" was not initialized.`)

          return
        }

        await initPromises[id]
      }

      return plugin.page?.({
        payload: { url: pageviewURL, properties: payload },
      })
    }),
  )
}

async function identify(
  { plugins, options, initPromises }: AnalyticsContext,
  {
    userId,
    anonymousId,
    traits,
  }: {
    userId?: string | null
    anonymousId?: string
    traits?: unknown
  } = {},
  { services }: { services?: Record<string, unknown> } = {},
) {
  if (process.env.NODE_ENV !== 'production' && options.debug) {
    console.info(
      `Identifying user "${userId}" on: ${plugins
        .map(([id]) => id)
        .join(', ')}`,
    )
  }

  return Promise.allSettled(
    plugins.map(async ([id, plugin]) => {
      if (services?.[id] === false) return

      if (!plugin.loaded) {
        if (!(id in initPromises)) {
          console.error(`Analytics plugin "${id}" was not initialized.`)

          return
        }

        await initPromises[id]
      }

      return plugin.identify?.({
        payload: { userId, anonymousId, traits },
      })
    }),
  )
}

function initialize({ plugins, options, initPromises }: AnalyticsContext) {
  if (process.env.NODE_ENV !== 'production' && options.debug) {
    console.info(
      `Initializing plugins: ${plugins.map(([id]) => id).join(', ')}`,
    )
  }

  for (const [id, plugin] of plugins) {
    if (plugin.loaded === true) continue
    initPromises[id] = Promise.resolve(plugin.initialize()).then(() => {
      plugin.loaded = true
    })
  }

  return Promise.allSettled(Object.values(initPromises))
}

function Analytics(options: AnalyticsWrapperOptions) {
  const plugins = Object.entries(options?.services ?? {})
  const initPromises: Record<string, Promise<void>> = {}

  plugins.forEach(([_, plugin]) => {
    plugin.loaded = false
  })

  const ctx: AnalyticsContext = {
    plugins,
    options,
    initPromises,
  }

  return {
    initialize: initialize.bind(null, ctx),
    identify: identify.bind(null, ctx),
    anonymize({ anonymousId }: { anonymousId?: string } = {}) {
      return this.identify({ userId: null, anonymousId })
    },
    track: track.bind(null, ctx),
    page: page.bind(null, ctx),
  }
}

export { Analytics }
