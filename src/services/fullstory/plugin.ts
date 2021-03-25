import type {
  PluginContext,
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
} from '../../types'
import { addFullstoryScript } from './script'

type Options = {
  org: string
}

const FS_SESSION_KEY = 'fullstory-session-url'
const FS_UID_KEY = 'fullstory-session-uid'

const fullstory = ({ org }: Options) => {
  function load(this: PluginContext) {
    return addFullstoryScript({
      org,
      debug: this.config.debug,
    })
  }

  function unload() {
    document.querySelector('script[src*="fullstory"]')?.remove()
    delete window.FS
  }

  function event(
    this: PluginContext,
    { label, ...options }: TrackEventOptions,
  ) {
    this.assertValues({ label })

    window.FS.event(label, options)
  }

  function pageview(this: PluginContext, { page }: PageviewOptions) {
    this.assertValues({ page })

    window.FS.event('Page View', { page })
  }

  function identify(this: PluginContext, userInfo: IdentifyOptions = {}) {
    this.assertKeys(userInfo, ['id'])

    const { id } = userInfo

    if (id == null) return
    window.FS.identify(id, userInfo)
    startSession(id)
  }

  function anonymize() {
    window.sessionStorage.removeItem(FS_SESSION_KEY)
    window.sessionStorage.removeItem(FS_UID_KEY)
    window.FS.identify(false)
  }

  function startSession(userId: string) {
    const currentSessionId = userId

    if (currentSessionId == null) return

    const existingSessionId = window.sessionStorage.getItem(FS_UID_KEY)
    const shouldSetNewSession =
      existingSessionId == null || existingSessionId !== currentSessionId

    if (shouldSetNewSession) {
      window.sessionStorage.setItem(
        FS_SESSION_KEY,
        window.FS.getCurrentSessionURL(),
      )

      window.sessionStorage.setItem(FS_UID_KEY, currentSessionId)

      if (!existingSessionId) {
        console.debug('=== Identified FullStory User ===\n', currentSessionId)
      } else {
        window.FS.restart()
        console.debug('=== Previous FullStory User ===\n', existingSessionId)
        console.debug('=== Identified FullStory User ===\n', currentSessionId)
      }
    } else {
      const existingSessionUrl = window.sessionStorage.getItem(FS_SESSION_KEY)

      console.debug('=== Prev. FullStory Session ===\n', existingSessionUrl)
    }

    console.debug(
      '======= FullStory Session ========\n',
      window.FS.getCurrentSessionURL(),
    )
  }

  return {
    name: 'fullstory' as const,
    load,
    unload,
    pageview,
    event,
    identify,
    anonymize,
  }
}

export { fullstory }
