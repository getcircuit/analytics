import type { Client } from '@bugsnag/core'

import type {
  PluginContext,
  IdentifyOptions,
  TrackEventOptions,
} from '../../types'

type Options = {
  client: Client
}

const removeUndefinedProps = (o: unknown) => JSON.parse(JSON.stringify(o))

const bugsnag = ({ client }: Options) => {
  let bugsnagClient: Client

  async function load() {
    bugsnagClient = client

    return bugsnagClient
  }

  function event(
    this: PluginContext,
    { label, ...options }: TrackEventOptions,
  ) {
    this.assertValues({ label })

    return bugsnagClient.leaveBreadcrumb(label, options)
  }

  function error(traceObj: { message: string; [key: string]: unknown }) {
    bugsnagClient.notify(new Error(traceObj.message), (e) => {
      e.severity = 'error'
      e.addMetadata('meta', removeUndefinedProps(traceObj))
    })
  }

  function warn(traceObj: { message: string; [key: string]: unknown }) {
    bugsnagClient.notify(new Error(traceObj.message), (e) => {
      e.severity = 'warning'
      e.addMetadata('meta', removeUndefinedProps(traceObj))
    })
  }

  function info(traceObj: { message: string; [key: string]: unknown }) {
    bugsnagClient.notify(new Error(traceObj.message), (e) => {
      e.severity = 'info'
      e.addMetadata('meta', removeUndefinedProps(traceObj))
    })
  }

  function identify(this: PluginContext, userInfo: IdentifyOptions) {
    this.assertKeys(userInfo, ['id', 'email', 'name'])

    const { id, email, name } = userInfo

    bugsnagClient.setUser(id, email, name)
    bugsnagClient.addMetadata('user', userInfo)
  }

  function anonymize() {
    bugsnagClient.setUser(undefined, undefined, undefined)
    bugsnagClient.clearMetadata('user')
  }

  return {
    name: 'bugsnag' as const,
    load,
    event,
    identify,
    anonymize,
    error,
    warn,
    info,
  }
}

export { bugsnag }
