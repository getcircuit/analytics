// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable node/global-require */
import { createPlugin } from '../plugin'

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

const googleAnalytics = createPlugin(({ trackingId, debug }: Options) => {
  return {
    async load() {
      if (!window.ga) {
        /* eslint-disable */
        // prettier-ignore
        ;(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script',`https://www.google-analytics.com/analytics${debug ? '_debug' : ''}.js`,'ga');
        /* eslint-enable */
      }

      window.ga('create', trackingId, 'auto')
    },
    unload() {
      document.querySelector('script[src*="google-analytics"]')?.remove()
      delete window.ga
    },
    event(options) {
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
    },
    pageview({ page, location, title }) {
      return gaSend({ hitType: 'pageview', page, location, title })
    },
    identify() {
      // const userDetails = this.identifySetup(user)
      // window.ga('set', 'userId', id);
      throw new Error('todo - Implement identify()')
    },
  }
})

export { googleAnalytics }
