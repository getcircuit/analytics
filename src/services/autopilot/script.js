const apiBaseURL = 'https://nimblebird.co/anywhere/'

export async function addAutoPilotScript({ apiKey }) {
  if (window.Autopilot) return

  const options = { app: true }

  window.AutopilotAnywhere = {
    _runQueue: [],
    run() {
      this._runQueue.push(arguments)
    },
  }

  window.Autopilot = window.AutopilotAnywhere

  let query = [
    `t=${encodeURIComponent(document.title || '')}`,
    `u=${encodeURIComponent(document.location.href || '')}`,
    `r=${encodeURIComponent(document.referrer || '')}`,
  ].join('&')

  if (options.app) {
    query = `devmode=true&${query}`
  }

  const scriptTag = document.createElement('script')

  scriptTag.src = `${apiBaseURL}${apiKey}?${query}`
  scriptTag.type = 'text/javascript'
  scriptTag.async = true

  document.head.appendChild(scriptTag)
}
