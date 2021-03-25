import type {
  PluginContext,
  PageviewOptions,
  IdentifyOptions,
} from '../../types'
import { addHelpscoutScript } from './script'

type Options = {
  apiKey: string
}

const helpscout = ({ apiKey }: Options) => {
  function load() {
    addHelpscoutScript()
    window.Beacon('init', apiKey)
  }

  function unload() {
    document.querySelector('script[src*="fbevents"]')?.remove()

    delete window.fbq
    delete window._fbq
  }

  // @TODO Not supported yet by Beacon SDK
  // function event({ label, ..._options }: TrackEventOptions) {
  //   this.assert('trackEvent', 'name', name);
  //   this._super(...arguments);
  //   options.error = error;
  //   return window.Beacon('event', { name: label, options });
  // }

  function pageview(
    this: PluginContext,
    { title, location, page }: PageviewOptions,
  ) {
    console.log({ title, location })
    this.assertValues({ title, location })

    window.Beacon('event', {
      type: 'page-viewed',
      url: location,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      title: title || page || location,
    })
    window.Beacon('suggest')
  }

  function identify(this: PluginContext, userInfo: IdentifyOptions) {
    this.assertKeys(userInfo, [
      'id',
      'name',
      'fullName',
      'email',
      'phone',
      'uid',
    ])

    window.Beacon('identify', userInfo)
    window.Beacon('session-data', {
      releaseStage: this.config.env,
      appVersion: this.config.appVersion,
    })
  }

  function anonymize() {
    window.Beacon('logout')
  }

  return {
    name: 'helpscout' as const,
    load,
    unload,
    pageview,
    identify,
    anonymize,
  }
}

export { helpscout }
