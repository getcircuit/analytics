import { Analytics, servicePlugin } from './index'

const pluginSample = servicePlugin(() => {
  return {
    initialize: jest.fn(),
    destroy: jest.fn(),
    event: jest.fn(),
    identify: jest.fn(),
    anonymize: jest.fn(),
    pageview: jest.fn(),
  }
})

test('initializes all plugins', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  expect(analytics.services.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(false)

  await analytics.initialize()

  expect(analytics.services.sampleService1.initialize).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService2.initialize).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(true)
})

test('lazily initialize plugins that implement the executed method', async () => {
  const analytics = Analytics({
    services: {
      identifyService: {
        initialize: jest.fn(),
        identify: jest.fn(),
      },
      eventService: {
        initialize: jest.fn(),
        event: jest.fn(),
      },
      pageviewService: {
        initialize: jest.fn(),
        pageview: jest.fn(),
      },
    },
  })

  await analytics.event({ label: 'click' })

  expect(analytics.services.identifyService.ctx.loaded).toBe(false)
  expect(analytics.services.pageviewService.ctx.loaded).toBe(false)
  expect(analytics.services.eventService.ctx.loaded).toBe(true)

  await analytics.identify({})
  expect(analytics.services.identifyService.ctx.loaded).toBe(true)
  expect(analytics.services.pageviewService.ctx.loaded).toBe(false)

  await analytics.pageview({})
  expect(analytics.services.pageviewService.ctx.loaded).toBe(true)
})

test('destroy all plugins', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  await analytics.initialize()

  expect(analytics.services.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(true)

  await analytics.destroy()

  expect(analytics.services.sampleService1.destroy).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService2.destroy).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(false)
})

test('sends tracked event to all registered plugins', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  await analytics.event({
    label: 'click',
  })

  expect(analytics.services.sampleService1.event).toHaveBeenCalledWith({
    label: 'click',
  })
  expect(analytics.services.sampleService2.event).toHaveBeenCalledWith({
    label: 'click',
  })
})

test('sends page view to all registered plugins', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  analytics.initialize()
  await analytics.pageview()

  expect(analytics.services.sampleService1.pageview).toHaveBeenCalledWith({
    page: '/',
  })
  expect(analytics.services.sampleService2.pageview).toHaveBeenCalledWith({
    page: '/',
  })
})

test('can override url when sending a page view', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  await analytics.pageview({ page: '/potato' })

  expect(analytics.services.sampleService1.pageview).toHaveBeenCalledWith({
    page: '/potato',
  })
  expect(analytics.services.sampleService2.pageview).toHaveBeenCalledWith({
    page: '/potato',
  })
})

test('delegates identify to plugins', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  await analytics.identify({
    userId: 'potato',
  })

  expect(analytics.services.sampleService1.identify).toHaveBeenCalledWith({
    userId: 'potato',
  })
  expect(analytics.services.sampleService2.identify).toHaveBeenCalledWith({
    userId: 'potato',
  })
})

test('anonymizes a user', async () => {
  const analytics = Analytics({
    services: {
      sampleService1: pluginSample(),
      sampleService2: pluginSample(),
    },
  })

  await analytics.anonymize()

  expect(analytics.services.sampleService1.identify).toHaveBeenCalledWith({
    userId: null,
  })
  expect(analytics.services.sampleService2.identify).toHaveBeenCalledWith({
    userId: null,
  })
})

test('should not call methods defined on "explicitUseOnly"', async () => {
  const analytics = Analytics({
    services: {
      event: pluginSample({ explicitUseOnly: ['event'] }),
      pageview: pluginSample({ explicitUseOnly: ['pageview'] }),
      identify: pluginSample({ explicitUseOnly: ['identify'] }),
    },
  })

  await analytics.event({ label: 'potato' })
  await analytics.pageview()
  await analytics.identify({})

  expect(analytics.services.event.event).toHaveBeenCalledTimes(0)
  expect(analytics.services.pageview.event).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.event).toHaveBeenCalledTimes(1)

  expect(analytics.services.event.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.pageview).toHaveBeenCalledTimes(0)
  expect(analytics.services.identify.pageview).toHaveBeenCalledTimes(1)

  expect(analytics.services.event.identify).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.identify).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.identify).toHaveBeenCalledTimes(0)
})

test('should call methods defined on "explicitUseOnly" when explicitly defined', async () => {
  const analytics = Analytics({
    services: {
      event: pluginSample({ explicitUseOnly: ['event'] }),
      pageview: pluginSample({ explicitUseOnly: ['pageview'] }),
      identify: pluginSample({ explicitUseOnly: ['identify'] }),
    },
  })

  await analytics.event({ label: 'potato' }, { services: { event: true } })
  await analytics.pageview(null, { services: { pageview: true } })
  await analytics.identify({}, { services: { identify: true } })

  expect(analytics.services.event.event).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.event).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.event).toHaveBeenCalledTimes(1)

  expect(analytics.services.event.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.pageview).toHaveBeenCalledTimes(1)

  expect(analytics.services.event.identify).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.identify).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.identify).toHaveBeenCalledTimes(1)
})
