import type { IdentifyOptions, PluginContext } from '../../types'
import { addIntercomScript } from './script'

type Options = {
  workspaceId: string
}

const intercom = ({ workspaceId }: Options) => {
  function load() {
    addIntercomScript({ workspaceId })
    window.Intercom('boot', { app_id: workspaceId })
  }

  function unload() {
    document.querySelector('script[src*="intercom.io"]')?.remove()

    delete window.Intercom
  }

  function pageview(this: PluginContext) {
    window.Intercom('update', {
      last_request_at: Math.floor(new Date().getTime() / 1000),
    })
  }

  function identify(this: PluginContext, args: IdentifyOptions) {
    this.assertKeys(args, ['id', 'email'])

    window.Intercom('boot', {
      app_id: workspaceId,
      email: args.email,
      user_id: args.id,
    })
  }

  function anonymize() {
    window.Intercom('shutdown')
    window.Intercom('boot', { app_id: workspaceId })
  }

  return {
    name: 'intercom' as const,
    load,
    unload,
    pageview,
    identify,
    anonymize,
  }
}

export { intercom }
