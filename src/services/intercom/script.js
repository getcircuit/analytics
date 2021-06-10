export function addIntercomScript({ workspaceId }) {
  var w = window
  var ic = w.Intercom
  if (typeof ic === 'function') {
    ic('reattach_activator')
    ic('update', w.intercomSettings)
    return
  }
  var d = document
  var i = function () {
    i.c(arguments)
  }
  i.q = []
  i.c = function (args) {
    i.q.push(args)
  }
  w.Intercom = i

  // This script was modified from the original (besides formatting)
  // Because it uses the onload event of the window to load the script
  // We don't want that. We want it to load the script when this function is called.
  var s = d.createElement('script')
  s.type = 'text/javascript'
  s.async = true
  s.src = 'https://widget.intercom.io/widget/' + workspaceId
  var x = d.getElementsByTagName('script')[0]
  x.parentNode.insertBefore(s, x)
}
