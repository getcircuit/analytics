import { Analytics, createPlugin } from './index'
import type { Service } from './types'

// eslint-disable-next-line @typescript-eslint/ban-types
function getMockPlugin<Options = {}, Id extends string = string>({
  id,
  options,
  methods,
}: {
  id: Id
  options?: Options
  methods?: string[]
}) {
  return createPlugin<Id>(id, () => {
    if (methods == null) {
      methods = ['event', 'pageview', 'identify', 'anonymize', 'error']
    }

    // create noop methods
    return (Object.fromEntries(
      ['load', 'unload', ...methods].map((name) => [name, jest.fn()]),
    ) as unknown) as Service
  })(options)
}

test('load all services', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  expect(analytics.plugins.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.plugins.sampleService2.ctx.loaded).toBe(false)

  await analytics.loadServices()

  expect(analytics.plugins.sampleService1.load).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService2.load).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.plugins.sampleService2.ctx.loaded).toBe(true)
})

test('lazily initialize plugins that implement the executed method', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'identifyService', methods: ['identify'] }),
      getMockPlugin({ id: 'eventService', methods: ['event'] }),
      getMockPlugin({ id: 'pageviewService', methods: ['pageview'] }),
    ],
  })

  await analytics.event({ label: 'click' })

  expect(analytics.plugins.identifyService.ctx.loaded).toBe(false)
  expect(analytics.plugins.pageviewService.ctx.loaded).toBe(false)
  expect(analytics.plugins.eventService.ctx.loaded).toBe(true)

  await analytics.identify({})
  expect(analytics.plugins.identifyService.ctx.loaded).toBe(true)
  expect(analytics.plugins.pageviewService.ctx.loaded).toBe(false)

  await analytics.pageview()
  expect(analytics.plugins.pageviewService.ctx.loaded).toBe(true)
})

test('unload all services', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.loadServices()

  expect(analytics.plugins.sampleService1.ctx.loaded).toBe(true)
  expect(analytics.plugins.sampleService2.ctx.loaded).toBe(true)

  await analytics.unloadServices()

  expect(analytics.plugins.sampleService1.unload).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService2.unload).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService1.ctx.loaded).toBe(false)
  expect(analytics.plugins.sampleService2.ctx.loaded).toBe(false)
})

test('sends tracked event to all registered plugins', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.event({
    label: 'click',
  })

  expect(analytics.plugins.sampleService1.event).toHaveBeenCalledWith({
    label: 'click',
  })
  expect(analytics.plugins.sampleService2.event).toHaveBeenCalledWith({
    label: 'click',
  })
})

test('sends page view to all registered plugins', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  analytics.loadServices()
  await analytics.pageview()

  expect(analytics.plugins.sampleService1.pageview).toHaveBeenCalledWith({
    page: '/',
  })
  expect(analytics.plugins.sampleService2.pageview).toHaveBeenCalledWith({
    page: '/',
  })
})

test('can override url when sending a page view', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.pageview({ page: '/potato' })

  expect(analytics.plugins.sampleService1.pageview).toHaveBeenCalledWith({
    page: '/potato',
  })
  expect(analytics.plugins.sampleService2.pageview).toHaveBeenCalledWith({
    page: '/potato',
  })
})

test('delegates identify to plugins', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.identify({
    userId: 'potato',
  })

  expect(analytics.plugins.sampleService1.identify).toHaveBeenCalledWith({
    userId: 'potato',
  })
  expect(analytics.plugins.sampleService2.identify).toHaveBeenCalledWith({
    userId: 'potato',
  })
})

test('anonymizes a user', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ id: 'sampleService1' }),
      getMockPlugin({ id: 'sampleService2' }),
    ],
  })

  await analytics.anonymize()

  expect(analytics.plugins.sampleService1.identify).toHaveBeenCalledWith({
    userId: null,
  })
  expect(analytics.plugins.sampleService2.identify).toHaveBeenCalledWith({
    userId: null,
  })
})

test('should not call methods defined on "explicitUseOnly"', async () => {
  const analytics = Analytics({
    plugins: [
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

  expect(analytics.plugins.event.event).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.pageview.event).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.identify.event).toHaveBeenCalledTimes(1)

  expect(analytics.plugins.event.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.pageview.pageview).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.identify.pageview).toHaveBeenCalledTimes(1)

  expect(analytics.plugins.event.identify).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.pageview.identify).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.identify.identify).toHaveBeenCalledTimes(0)
})

test('should only call methods defined via "services"', async () => {
  const analytics = Analytics({
    plugins: [
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

  expect(analytics.plugins.event.event).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.pageview.event).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.identify.event).toHaveBeenCalledTimes(0)

  expect(analytics.plugins.event.pageview).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.pageview.pageview).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.identify.pageview).toHaveBeenCalledTimes(0)

  expect(analytics.plugins.event.identify).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.pageview.identify).toHaveBeenCalledTimes(0)
  expect(analytics.plugins.identify.identify).toHaveBeenCalledTimes(1)
})

test('passes abstraction context to plugins', async () => {
  const plugin1 = jest.fn(
    createPlugin('plugin1', () => ({
      load: () => {},
    }))(),
  )

  const plugin2 = jest.fn(
    createPlugin('plugin1', () => ({
      load: () => {},
    }))(),
  )

  Analytics({
    debug: true,
    appVersion: '1.0.0',
    plugins: [plugin1, plugin2],
  })

  expect(plugin1).toBeCalledWith(
    expect.objectContaining({
      debug: true,
      appVersion: '1.0.0',
    }),
  )
  expect(plugin2).toBeCalledWith(
    expect.objectContaining({
      debug: true,
      appVersion: '1.0.0',
    }),
  )
})
