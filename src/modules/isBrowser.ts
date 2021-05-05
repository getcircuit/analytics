function checkIsBrowser() {
  return (
    typeof window !== 'undefined' && window?.document?.createElement != null
  )
}

/**
 * `true` running in a browser environment or `false` not (SSR).
 */
export const isBrowser = checkIsBrowser()
