import { Analytics } from './index'
import type { Plugin, SharedContext } from './types'

// eslint-disable-next-line @typescript-eslint/ban-types
function getMockPlugin<Name extends string = string>({
  name,
  methods,
}: {
  name: Name
  methods?: string[]
}) {
  if (methods == null) {
    methods = ['event', 'pageview', 'identify', 'anonymize', 'error']
  }

  // create noop methods
  return ({
    ...Object.fromEntries(
      ['load', 'unload', ...methods].map((method) => [method, jest.fn()]),
    ),
    name,
  } as unknown) as Plugin<Name>
}

test('load all services', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
    ],
  })

  expect(analytics.plugins.sampleService1.context.loaded).toBe(false)
  expect(analytics.plugins.sampleService2.context.loaded).toBe(false)

  await analytics.loadServices()

  expect(analytics.plugins.sampleService1.load).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService2.load).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService1.context.loaded).toBe(true)
  expect(analytics.plugins.sampleService2.context.loaded).toBe(true)
})

test('lazily initialize plugins that implement the executed method', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'identifyService', methods: ['identify'] }),
      getMockPlugin({ name: 'eventService', methods: ['event'] }),
      getMockPlugin({ name: 'pageviewService', methods: ['pageview'] }),
    ],
  })

  await analytics.event({ label: 'click' })

  expect(analytics.plugins.identifyService.context.loaded).toBe(false)
  expect(analytics.plugins.pageviewService.context.loaded).toBe(false)
  expect(analytics.plugins.eventService.context.loaded).toBe(true)

  await analytics.identify({})
  expect(analytics.plugins.identifyService.context.loaded).toBe(true)
  expect(analytics.plugins.pageviewService.context.loaded).toBe(false)

  await analytics.pageview()
  expect(analytics.plugins.pageviewService.context.loaded).toBe(true)
})

test('unload all services', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
    ],
  })

  await analytics.loadServices()

  expect(analytics.plugins.sampleService1.context.loaded).toBe(true)
  expect(analytics.plugins.sampleService2.context.loaded).toBe(true)

  await analytics.unloadServices()

  expect(analytics.plugins.sampleService1.unload).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService2.unload).toHaveBeenCalledTimes(1)
  expect(analytics.plugins.sampleService1.context.loaded).toBe(false)
  expect(analytics.plugins.sampleService2.context.loaded).toBe(false)
})

test('sends tracked event to all registered plugins', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
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
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
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
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
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
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
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
      getMockPlugin({ name: 'sampleService1' }),
      getMockPlugin({ name: 'sampleService2' }),
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

test('should exclude plugin from tracking calls', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'event' }),
      getMockPlugin({ name: 'pageview' }),
      getMockPlugin({ name: 'identify' }),
    ],
  })

  await analytics.event({ label: 'potato' }, { exclude: ['event'] })
  await analytics.pageview(null, { exclude: ['pageview'] })
  await analytics.identify({}, { exclude: ['identify'] })

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

test('should only call included services', async () => {
  const analytics = Analytics({
    plugins: [
      getMockPlugin({ name: 'event' }),
      getMockPlugin({ name: 'pageview' }),
      getMockPlugin({ name: 'identify' }),
    ],
  })

  await analytics.event({ label: 'potato' }, { include: ['event'] })
  await analytics.pageview(null, { include: ['pageview'] })
  await analytics.identify({}, { include: ['identify'] })

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

test('passes shared context to plugins', async () => {
  const plugin1 = {
    name: 'plugin1',
    load: jest.fn(),
    pageview: jest.fn(function pageview1(this: SharedContext) {
      return this
    }),
  }

  const plugin2 = {
    name: 'plugin2',
    load: jest.fn(),
    pageview: jest.fn(function pageview1(this: SharedContext) {
      return this
    }),
  }

  const analytics = Analytics({
    debug: true,
    appVersion: '1.0.0',
    plugins: [plugin1, plugin2],
  })

  const expectedContext = {
    meta: { appVersion: '1.0.0', debug: true, env: undefined },
  }

  await analytics.pageview()

  expect(plugin1.pageview).toReturnWith(
    expect.objectContaining(expectedContext),
  )
  expect(plugin2.pageview).toReturnWith(
    expect.objectContaining(expectedContext),
  )
})
