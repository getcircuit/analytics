import type {
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
} from '../../types'
import { addGoogleAnalyticsScript } from './script'

type Options = {
  trackingId: string
  debug?: boolean
}

const EVENT_KEYS = ['category', 'action', 'label', 'value']

function gaSend(options: Record<string, unknown>): Promise<void> {
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

  function event(options: TrackEventOptions) {
    const gaEventProps: Record<string, unknown> = Object.entries(
      options,
    ).reduce((acc, [prop, value]) => {
      for (const key in options) {
        if (EVENT_KEYS.includes(prop)) {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)

          gaEventProps[`event${capitalizedKey}`] = value
        } else {
          gaEventProps[key] = value
        }
      }

      return acc
    }, {})

    return gaSend({
      hitType: 'event',
      ...gaEventProps,
    })
  }

  function pageview({ page, location, title }: PageviewOptions) {
    return gaSend({ hitType: 'pageview', page, location, title })
  }

  function identify({ id }: IdentifyOptions) {
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
