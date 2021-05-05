import type {
  PluginContext,
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
} from '../../types'
import { addAmplitudeScript } from './script'

type Options = {
  apiKey: string
}

const amplitude = ({ apiKey }: Options) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  function load() {
    addAmplitudeScript({ apiKey })

    window.amplitude.getInstance().init(apiKey)
  }

  function unload() {
    document.querySelector('script[src*="cdn.amplitude.com"]')?.remove()
    delete window.amplitude
  }

  function event(
    this: PluginContext,
    { label, ...options }: TrackEventOptions,
  ) {
    this.assertValues({ label })

    return window.amplitude.getInstance().logEvent(label, options)
  }

  function pageview(
    this: PluginContext,
    { page, ...options }: PageviewOptions,
  ) {
    this.assertValues({ page })

    return window.amplitude.getInstance().logEvent('Pageview', options)
  }

  function identify(this: PluginContext, args: IdentifyOptions) {
    this.assertKeys(args, ['id', 'phone', 'email', 'displayName', 'uid'])

    window.amplitude.getInstance().setUserId(args.id)
    if (this.config.appVersion) {
      window.amplitude.getInstance().setVersionName(this.config.appVersion)
    }

    return trackAttributes(args)
  }

  function anonymize() {
    window.amplitude.getInstance().setUserId(null)
    window.amplitude.getInstance().regenerateDeviceId()
  }

  function trackAttributes(userAttributes: IdentifyOptions) {
    return window.amplitude.getInstance().setUserProperties(userAttributes)
  }

  return {
    name: 'amplitude' as const,
    load,
    unload,
    event,
    pageview,
    identify,
    anonymize,
  }
}

export { amplitude }
