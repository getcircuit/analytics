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
  let sdk: any

  function load() {
    addAmplitudeScript({ apiKey })
    sdk = window.amplitude.getsdk()
    sdk.init(apiKey)
  }

  function unload() {
    document.querySelector('script[src*="cdn.amplitude.com"]')?.remove()
    delete window.amplitude
    sdk = undefined
  }

  function event(
    this: PluginContext,
    { label, ...options }: TrackEventOptions,
  ) {
    this.assertValues({ label })

    return sdk.logEvent(label, options)
  }

  function pageview(
    this: PluginContext,
    { page, ...options }: PageviewOptions,
  ) {
    this.assertValues({ page })

    return sdk.logEvent('Pageview', options)
  }

  function identify(this: PluginContext, args: IdentifyOptions) {
    this.assertKeys(args, ['id', 'phone', 'email', 'displayName', 'uid'])

    sdk.setUserId(args.id)
    if (this.config.appVersion) {
      sdk.setVersionName(this.config.appVersion)
    }

    return trackAttributes(args)
  }

  function anonymize() {
    sdk.setUserId(null)
    sdk.regenerateDeviceId()
  }

  function trackAttributes(userAttributes: IdentifyOptions) {
    return sdk.setUserProperties(userAttributes)
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
