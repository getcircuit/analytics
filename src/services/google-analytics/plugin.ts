import type {
  PluginContext,
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
  GenericObject,
} from '../../types'
import { addGoogleAnalyticsScript } from './script'

type Options = {
  trackingId: string
  debug?: boolean
}

const EVENT_KEYS = ['category', 'action', 'label', 'value']

function gaSend(options: GenericObject): Promise<void> {
  return new Promise((resolve) => {
    window.ga('send', {
      ...options,
      hitCallback: () => resolve(),
    })
  })
}

const googleAnalytics = ({ trackingId, debug }: Options) => {
  function load() {
    return addGoogleAnalyticsScript({ trackingId, debug })
  }

  function unload() {
    document.querySelector('script[src*="google-analytics"]')?.remove()
    delete window.ga
  }

  function event(this: PluginContext, options: TrackEventOptions) {
    this.assertKeys(options, ['label'])

    const gaEventProps: GenericObject = Object.entries(options).reduce(
      (acc, [prop, value]) => {
        for (const key in options) {
          if (EVENT_KEYS.includes(prop)) {
            const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)

            gaEventProps[`event${capitalizedKey}`] = value
          } else {
            gaEventProps[key] = value
          }
        }

        return acc
      },
      {},
    )

    return gaSend({
      hitType: 'event',
      ...gaEventProps,
    })
  }

  function pageview(
    this: PluginContext,
    { page, location, title }: PageviewOptions,
  ) {
    this.assertValues({ page, location, title })

    return gaSend({ hitType: 'pageview', page, location, title })
  }

  function identify(this: PluginContext, { id }: IdentifyOptions) {
    this.assertValues({ id })

    window.ga('set', 'userId', id)
  }

  function anonymize() {
    window.ga('set', 'userId', null)
  }

  return {
    name: 'google-analytics' as const,
    load,
    unload,
    event,
    pageview,
    identify,
    anonymize,
  }
}

export { googleAnalytics }
