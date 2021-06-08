# `@getcircuit/analytics`

A thin analytics abstraction layer for Circuit's applications. It implements a basic plugin system for integrating with different analytics services.

## Usage

1. First things first, initialize the abstraction layer with the needed plugins:

```ts
import {
  Analytics,
  googleAnalytics,
  facebookPixel,
} from '@getcircuit/analytics'

export const analytics = Analytics({
  /** Current environment. Accessed by plugins.*/
  env: process.env.NODE_ENV,
  /** If true, logs every track call that is being made. (default: false) */
  debug: process.env.NODE_ENV === 'development',
  /** If true, tracking requests are not sent */
  dryRun: 'production',
  /** List of service plugins */
  plugins: [
    googleAnalytics({
      trackingId: 'UA-XXXXXX-X',
    }),
    facebookPixel({
      pixelId: 'xxxxxxx',
    }),
  ],
  /**
   * Optional map of hooks => plugin names.
   * Any plugin listed here will need to be explicitly included to have the related hook executed.
   * */
  explicitUse: {
    event: [...],
    pageview: [...],
    ...,
  }
})
```

2. Track actions, users and errors

After initializing, you can use the abstraction layer to send:

- Events: `analytics.event(...)`
- Pageviews: `analytics.pageview(...)`
- User identification: : `analytics.identify(...)`
- User anonymization: `analytics.anonymize(...)`
- Info logs: `analytics.info(...)`
- Warning logs: `analytics.warn(...)`
- Error logs: `analytics.error(...)`

Only plugins that implement the hook will be executed. The `load` of each plugin is deferred until one of its hooks are executed, which means that any analytics code will only be added to the DOM when sending a tracking request.

## Service plugin

A service plugin is just an object with a specific set of methods, which we call 'hooks' and a `name` property. The only mandatory hook is the `load()`, responsible for adding the service script to the DOM.

```ts
{
  name: string
  load: () => MaybePromise
  unload?: () => MaybePromise
  pageview?: (opts: PageviewOptions) => MaybePromise
  event?: (opts: TrackEventOptions) => MaybePromise
  identify?: (opts: IdentifyOptions) => MaybePromise
  anonymize?: () => MaybePromise
  info?: (opts: TraceOptions) => MaybePromise
  warn?: (opts: TraceOptions) => MaybePromise
  error?: (opts: TraceOptions) => MaybePromise
}
```

Apart from `load` and `unload`, each hook correspond to a method in the abstraction layer.

### Available plugins

- Amplitude
- Autopilot
- Bugsnag
- Facebook Pixel
- Fullstory
- Google Analytics
- Helpscout
- Intercom

### Hooks

Every hook has access to a `this` object which contains:

```ts
type PluginContext = {
  /** Configs passed onto the library */
  config: {
    env: string
    appVersion: string
    debug: boolean
  }
  /** Helper method to assert that an object has received certain props */
  assertKeys: (object, requiredKeys) => void
  /** Helper method to assert that every passed value is not undefined */
  assertValues: (objectOfValues) => void
}
```
