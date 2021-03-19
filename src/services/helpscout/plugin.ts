import type {
  PageviewOptions,
  IdentifyOptions,
  TrackEventOptions,
} from '../../types'
import { createPlugin } from '../../modules/plugin'
import { addHelpscoutScript } from './script'

type Options = {
  apiKey: string
}

const helpscout = createPlugin('helpscout', ({ apiKey }: Options, context) => {
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
  function event({ label, ..._options }: TrackEventOptions) {
    //   this.assert('trackEvent', 'name', name);
    //   this._super(...arguments);
    //   options.error = error;
    //   return window.Beacon('event', { name: label, options });
  }

  function pageview({ page, title, location }: PageviewOptions) {
    window.Beacon('suggest')
    window.Beacon('event', {
      path: page,
      title,
      type: 'page-viewed',
      url: location ?? document.location.href,
    })
  }

  function identify(userInfo: IdentifyOptions) {
    window.Beacon('identify', userInfo)
    window.Beacon('session-data', {
      // todo
      // releaseStage,
      appVersion: context.appVersion,
    })
  }

  function anonymize() {
    window.Beacon('logout')
  }

  return {
    load,
    unload,
    event,
    pageview,
    identify,
    anonymize,
  }
})

export { helpscout }
