import { Analytics, createPlugin } from './index'
import type { Service } from './types'

function getMockPlugin<Id extends string>({
  id,
  options,
  methods,
}: {
  id: Id
  options?: Record<string, unknown>
  methods?: string[]
}) {
  return createPlugin<Id>(id, () => {
    if (methods == null) {
      methods = ['event', 'pageview', 'identify', 'anonymize', 'error']
    }

    return (Object.fromEntries(
      ['load', 'unload', ...methods].map((name) => [name, jest.fn()]),
    ) as unknown) as Service
  })(options)
}

test('load all services', async () => {
  const analytics = Analytics({
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  expect(analytics.services.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(false)

  await analytics.loadServices()

  expect(analytics.services.sampleService1.load).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService2.load).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(true)
})

test('lazily initialize plugins that implement the executed method', async () => {
  const analytics = Analytics({
    services: [
      getMockPlugin({ id: 'identifyService', methods: ['identify'] }),
      getMockPlugin({ id: 'eventService', methods: ['event'] }),
      getMockPlugin({ id: 'pageviewService', methods: ['pageview'] }),
    ],
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

test('unload all services', async () => {
  const analytics = Analytics({
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.loadServices()

  expect(analytics.services.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(true)

  await analytics.unloadServices()

  expect(analytics.services.sampleService1.unload).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService2.unload).toHaveBeenCalledTimes(1)
  expect(analytics.services.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.services.sampleService2.ctx.loaded).toBe(false)
})

test('sends tracked event to all registered plugins', async () => {
  const analytics = Analytics({
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
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
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  analytics.loadServices()
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
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
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
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
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
    services: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
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
    services: [
      getMockPlugin({
        id: 'event',
        options: { explicitUseOnly: ['event'] },
      }),
      getMockPlugin({
        id: 'pageview',
        options: { explicitUseOnly: ['pageview'] },
      }),
      getMockPlugin({
        id: 'identify',
        options: { explicitUseOnly: ['identify'] },
      }),
    ],
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

test('should only call methods defined via "services"', async () => {
  const analytics = Analytics({
    services: [
      getMockPlugin({
        id: 'event',
        options: { explicitUseOnly: ['event'] },
      }),
      getMockPlugin({
        id: 'pageview',
        options: { explicitUseOnly: ['pageview'] },
      }),
      getMockPlugin({
        id: 'identify',
        options: { explicitUseOnly: ['identify'] },
      }),
    ],
  })

  await analytics.event({ label: 'potato' }, { services: ['event'] })
  await analytics.pageview(null, { services: ['pageview'] })
  await analytics.identify({}, { services: ['identify'] })

  expect(analytics.services.event.event).toHaveBeenCalledTimes(1)
  expect(analytics.services.pageview.event).toHaveBeenCalledTimes(0)
  expect(analytics.services.identify.event).toHaveBeenCalledTimes(0)

  expect(analytics.services.event.pageview).toHaveBeenCalledTimes(0)
  expect(analytics.services.pageview.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.services.identify.pageview).toHaveBeenCalledTimes(0)

  expect(analytics.services.event.identify).toHaveBeenCalledTimes(0)
  expect(analytics.services.pageview.identify).toHaveBeenCalledTimes(0)
  expect(analytics.services.identify.identify).toHaveBeenCalledTimes(1)
})
