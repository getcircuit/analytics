import type { MaybePromise } from '../types'

/** Quick and dirty Promise.allSettle ponyfill */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function allSettled(promises: Array<MaybePromise<any>>) {
  return Promise.all(promises.map((promise) => promise?.catch(() => undefined)))
}

// function parseUser(user: Record<string, unknown> = {}) {
//   const { uid, email, phoneNumber: phone, displayName: name } = user

//   const userId = uid;
//   const displayName = name || email || phone;
//   const distinctId = sha256((email || phone).toLowerCase()).toString();
//   const id = distinctId;

//   return {
//     id,
//     uid,
//     phone,
//     userId,
//     distinctId,
//     displayName,
//     fullName: name,
//     name: displayName,
//     email: email || this._createFallbackEmail(distinctId)
//   };
// },
