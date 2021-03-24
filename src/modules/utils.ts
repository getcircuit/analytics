import type { GenericObject, MaybePromise, PluginHooks } from '../types'

/** Quick and dirty Promise.allSettle ponyfill */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function allSettled(promises: Array<MaybePromise<any>>) {
  return Promise.all(
    promises.map((promise) =>
      promise?.catch((e: Error) => {
        console.error(`[Analytics] An error has occurred:\n`, e)
      }),
    ),
  )
}

export function getHookAssertionHelpers(
  pluginName: string,
  hook: keyof PluginHooks,
) {
  function assertKeys<T extends GenericObject>(
    record: T,
    props: Array<keyof T>,
  ) {
    const requiredProps = props.join(', ')
    const passedProps = Object.keys(record).join(', ')

    console.assert(
      props.every((prop) => prop in record),
      `[Analytics][plugin:"${pluginName}"] Hook "${hook}" requires the properties "${requiredProps}". Received "${passedProps}".`,
    )
  }

  function assertValues(values: GenericObject) {
    const props = Object.keys(values).join(', ')

    console.assert(
      Object.values(values).every((value) => typeof value !== 'undefined'),
      `[Analytics][plugin:"${pluginName}"] Hook "${hook}" requires defined values for "${props}" properties. Received "${JSON.stringify(
        values,
      )}".`,
    )
  }

  return {
    assertKeys,
    assertValues,
  }
}
