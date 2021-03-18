// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable node/global-require */

import { servicePlugin } from '../plugin'

type Options = {
  pixelId: string
}

const facebookPixel = servicePlugin(({ pixelId }: Options) => {
  return {
    async initialize() {
      if (!window.fbq) {
        /* eslint-disable */
        // prettier-ignore
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
        document,'script','https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
      }

      window?.fbq('init', pixelId)
    },
    destroy() {
      document.querySelector('script[src*="fbevents"]')?.remove()

      delete window.fbq
      delete window._fbq
    },
    event({ label, ...options }) {
      window?.fbq('track', label, options)
    },
    pageview() {
      window?.fbq('track', 'PageView')
    },
    identify() {
      // const userDetails = this.identifySetup(user)
      // window?.fbq('trackCustom', 'identify', userDetails)
      throw new Error('todo - Implement identify()')
    },
  }
})

export { facebookPixel }
