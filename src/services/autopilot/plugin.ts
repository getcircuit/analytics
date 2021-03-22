import type { SharedContext, IdentifyOptions } from '../../types'
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

const autopilot = ({ apiKey }: Options) => {
  function load() {
    return addAutoPilotScript({ apiKey })
  }

  function identify(
    this: SharedContext,
    { uid, email, phone, fullName, distinctId }: IdentifyOptions = {},
  ) {
    // todo

    window.Autopilot.run('associate', {
      ...getNameProps(fullName),
      MobilePhone: phone,
      Phone: phone,
      Email: email,
      custom: {
        'string--Distinct--Id': distinctId,
        'string--App--Version': this.meta.appVersion,
        'string--UID': uid,
      },
    })
  }

  return {
    name: 'autopilot' as const,
    load,
    identify,
  }
}

export { autopilot }
