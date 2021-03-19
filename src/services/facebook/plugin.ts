import type {
  PageviewOptions,
  IdentifyOptions,
  TrackEventOptions,
} from '../../types'
import { createPlugin } from '../../modules/plugin'
import { addFacebookScript } from './script'

type Options = {
  pixelId: string
}

const facebookPixel = createPlugin('facebook-pixel', ({ pixelId }: Options) => {
  function load() {
    return addFacebookScript({ pixelId })
  }

  function unload() {
    document.querySelector('script[src*="fbevents"]')?.remove()

    delete window.fbq
    delete window._fbq
  }

  function event({ label, ...options }: TrackEventOptions) {
    window?.fbq('track', label, options)
  }

  function pageview({ page }: PageviewOptions) {
    window?.fbq('track', 'PageView', { page })
  }

  function identify({ id }: IdentifyOptions) {
    window.fbq('trackCustom', 'identify', { id })
  }

  return {
    load,
    unload,
    event,
    pageview,
    identify,
  }
})

export { facebookPixel }
