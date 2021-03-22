import type {
  SharedContext,
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

  function event({ label, ...options }: TrackEventOptions) {
    return sdk.logEvent(label, options)
  }

  function pageview({ page, ...options }: PageviewOptions) {
    return sdk.logEvent('Pageview', options)
  }

  function identify(
    this: SharedContext,
    { id, uid, phone, email, displayName }: IdentifyOptions,
  ) {
    sdk.setUserId(id)
    if (this.meta.appVersion) {
      sdk.setVersionName(this.meta.appVersion)
    }

    return trackAttributes({
      id,
      uid,
      phone,
      email,
      displayName,
    })
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
