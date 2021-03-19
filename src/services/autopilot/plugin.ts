import type { IdentifyOptions } from '../../types'
import { createPlugin } from '../../modules/plugin'
import { addAutoPilotScript } from './script'

type Options = {
  apiKey: string
}

function getNameProps(fullName?: string) {
  const nameParts = fullName?.split(' ')

  if (!nameParts) {
    return null
  }

  return {
    FirstName: nameParts.slice(0, nameParts.length - 1),
    LastName: nameParts.slice(-1),
  }
}

const autopilot = createPlugin('autopilot', ({ apiKey }: Options, context) => {
  function load() {
    return addAutoPilotScript({ apiKey })
  }

  function identify({
    uid,
    email,
    phone,
    fullName,
    distinctId,
  }: IdentifyOptions = {}) {
    // todo

    window.Autopilot.run('associate', {
      ...getNameProps(fullName),
      MobilePhone: phone,
      Phone: phone,
      Email: email,
      custom: {
        'string--Distinct--Id': distinctId,
        'string--App--Version': context.appVersion,
        'string--UID': uid,
      },
    })
  }

  return {
    load,
    identify,
  }
})

export { autopilot }
