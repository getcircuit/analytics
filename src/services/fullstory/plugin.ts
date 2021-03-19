import type {
  IdentifyOptions,
  PageviewOptions,
  TrackEventOptions,
} from '../../types'
import { createPlugin } from '../../modules/plugin'
import { addFullstoryScript } from './script'

type Options = {
  org: string
  debug?: boolean
}

const FS_SESSION_KEY = 'fullstory-session-url'
const FS_UID_KEY = 'fullstory-session-uid'

const fullstory = createPlugin('fullstory', ({ org, debug }: Options) => {
  function load() {
    return addFullstoryScript({ org, debug })
  }

  function unload() {
    document.querySelector('script[src*="fullstory"]')?.remove()
    delete window.FS
  }

  function event({ label, ...options }: TrackEventOptions) {
    window.FS.event(label, options)
  }

  function pageview({ page }: PageviewOptions) {
    window.FS.event('Page View', { page })
  }

  function identify(userInfo: IdentifyOptions = {}) {
    const { id } = userInfo

    if (id == null) return
    window.FS.identify(id, userInfo)
    startSession(userInfo)
  }

  function anonymize() {
    window.sessionStorage.removeItem(FS_SESSION_KEY)
    window.sessionStorage.removeItem(FS_UID_KEY)
    window.FS.identify(false)
  }

  function startSession(userInfo: IdentifyOptions) {
    const currentSessionUID = userInfo.id

    if (currentSessionUID == null) return

    const existingSessionUID = window.sessionStorage.getItem(FS_UID_KEY)
    const shouldSetNewSession =
      existingSessionUID == null || existingSessionUID !== currentSessionUID

    if (shouldSetNewSession) {
      window.sessionStorage.setItem(
        FS_SESSION_KEY,
        window.FS.getCurrentSessionURL(),
      )

      window.sessionStorage.setItem(FS_UID_KEY, currentSessionUID)

      if (!existingSessionUID) {
        console.debug('=== Identified FullStory User ===\n', currentSessionUID)
      } else {
        window.FS.restart()
        console.debug('=== Previous FullStory User ===\n', existingSessionUID)
        console.debug('=== Identified FullStory User ===\n', currentSessionUID)
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
    load,
    unload,
    pageview,
    event,
    identify,
    anonymize,
  }
})

export { fullstory }
