/** Quick and dirty Promise.allSettle ponyfill */
export function allSettled(promises: Array<Promise<unknown>>) {
  return Promise.all(promises.map((promise) => promise.catch(() => undefined)))
}
