import { Analytics } from '.'
import type { ServicePluginFactory } from './types'

const sampleService: ServicePluginFactory<unknown> = () => {
  return {
    initialize: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    anonymize: jest.fn(),
    page: jest.fn(),
  }
}

describe('initializing', () => {
  it('initializes all plugins', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    expect(samepleServicePlugin1.loaded).toBe(false)
    expect(samepleServicePlugin2.loaded).toBe(false)

    await analytics.initialize()

    expect(samepleServicePlugin1.initialize).toHaveBeenCalledTimes(1)
    expect(samepleServicePlugin2.initialize).toHaveBeenCalledTimes(1)
    expect(samepleServicePlugin1.loaded).toBe(true)
    expect(samepleServicePlugin2.loaded).toBe(true)
  })
})

describe('tracking events', () => {
  it('sends tracked event to all registered plugins', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    analytics.initialize()
    await analytics.track({
      event: 'click',
    })

    expect(samepleServicePlugin1.track).toHaveBeenCalledWith({
      payload: { event: 'click' },
    })
    expect(samepleServicePlugin2.track).toHaveBeenCalledWith({
      payload: { event: 'click' },
    })
  })
})

describe('sending page views', () => {
  it('sends page view to all registered plugins', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    analytics.initialize()
    await analytics.page()

    expect(samepleServicePlugin1.page).toHaveBeenCalledWith({
      payload: { url: '/' },
    })
    expect(samepleServicePlugin2.page).toHaveBeenCalledWith({
      payload: { url: '/' },
    })
  })

  it('can override url when sending a page view', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    analytics.initialize()
    await analytics.page({
      url: '/potato',
    })

    expect(samepleServicePlugin1.page).toHaveBeenCalledWith({
      payload: { url: '/potato' },
    })
    expect(samepleServicePlugin2.page).toHaveBeenCalledWith({
      payload: { url: '/potato' },
    })
  })
})

describe('identifying', () => {
  it('delegates identify to plugins', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    analytics.initialize()
    await analytics.identify({
      userId: 'potato',
    })

    expect(samepleServicePlugin1.identify).toHaveBeenCalledWith({
      payload: { userId: 'potato' },
    })
    expect(samepleServicePlugin2.identify).toHaveBeenCalledWith({
      payload: { userId: 'potato' },
    })
  })

  it('anonymizes a user', async () => {
    const samepleServicePlugin1 = sampleService({
      trackingId: 'potato',
    })

    const samepleServicePlugin2 = sampleService({
      trackingId: 'potato2',
    })

    const analytics = Analytics({
      services: {
        sampleService1: samepleServicePlugin1,
        sampleService2: samepleServicePlugin2,
      },
    })

    analytics.initialize()
    await analytics.anonymize()

    expect(samepleServicePlugin1.identify).toHaveBeenCalledWith({
      payload: { userId: null },
    })
    expect(samepleServicePlugin2.identify).toHaveBeenCalledWith({
      payload: { userId: null },
    })
  })
})
