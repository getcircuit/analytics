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
    { page, title, location }: PageviewOptions,
  ) {
    this.assertValues({ page, title })

    window.Beacon('suggest')
    window.Beacon('event', {
      path: page,
      title,
      type: 'page-viewed',
      url: location ?? document.location.href,
    })
  }

  function identify(this: PluginContext, userInfo: IdentifyOptions) {
    this.assertKeys(userInfo, [
      'uid',
      'id',
      'name',
      'fullName',
      'email',
      'phone',
      'distinctId',
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
