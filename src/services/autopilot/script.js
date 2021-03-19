export async function addAutoPilotScript({ apiKey }) {
  if (window.Autopilot) return
  ;(function (o) {
    var b = 'https://nimblebird.co/anywhere/',
      t = apiKey,
      a = (window.AutopilotAnywhere = {
        _runQueue: [],
        run: function () {
          this._runQueue.push(arguments)
        },
      }),
      c = encodeURIComponent,
      s = 'SCRIPT',
      d = document,
      l = d.getElementsByTagName(s)[0],
      p =
        't=' +
        c(d.title || '') +
        '&u=' +
        c(d.location.href || '') +
        '&r=' +
        c(d.referrer || ''),
      j = 'text/javascript',
      z,
      y
    if (!window.Autopilot) window.Autopilot = a
    if (o.app) p = 'devmode=true&' + p
    z = function (src, asy) {
      var e = d.createElement(s)
      e.src = src
      e.type = j
      e.async = asy
      l.parentNode.insertBefore(e, l)
    }
    y = function () {
      z(b + t + '?' + p, true)
    }
    if (window.attachEvent) {
      window.attachEvent('onload', y)
    } else {
      window.addEventListener('load', y, false)
    }
  })({ app: true })
}
