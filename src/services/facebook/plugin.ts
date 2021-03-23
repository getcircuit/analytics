import type {
  PageviewOptions,
  IdentifyOptions,
  TrackEventOptions,
  PluginContext,
} from '../../types'
import { addFacebookScript } from './script'

type Options = {
  pixelId: string
}

const facebookPixel = ({ pixelId }: Options) => {
  function load() {
    return addFacebookScript({ pixelId })
  }

  function unload() {
    document.querySelector('script[src*="fbevents"]')?.remove()

    delete window.fbq
    delete window._fbq
  }

  function event(
    this: PluginContext,
    { label, ...options }: TrackEventOptions,
  ) {
    this.assertValues({ label })

    window?.fbq('track', label, options)
  }

  function pageview(this: PluginContext, args: PageviewOptions) {
    this.assertKeys(args, ['page'])

    window?.fbq('track', 'PageView', args)
  }

  function identify(this: PluginContext, args: IdentifyOptions) {
    this.assertKeys(args, [
      'uid',
      'id',
      'name',
      'fullName',
      'email',
      'phone',
      'distinctId',
    ])

    window.fbq('trackCustom', 'identify', args)
  }

  return {
    name: 'facebook-pixel' as const,
    load,
    unload,
    event,
    pageview,
    identify,
  }
}

export { facebookPixel }
