import { Analytics } from './index'
import type { GenericObject, Plugin, PluginContext } from './types'

// eslint-disable-next-line @typescript-eslint/ban-types
function getMockPlugin<Name extends string = string>({
  name,
  hooks: methods,
}: {
  name: Name
  hooks?: string[]
}) {
  if (methods == null) {
    methods = [
      'event',
      'pageview',
      'identify',
      'anonymize',
      'error',
      'warn',
      'info',
    ]
  }

  // create noop methods
  return ({
    ...Object.fromEntries(
      ['load', 'unload', ...methods].map((method) => [method, jest.fn()]),
    ),
    name,
  } as unknown) as Plugin<Name>
}

describe('loading and unloading', () => {
  it('load all services', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    expect(analytics.plugins.sampleService1.loaded).toBe(false)
    expect(analytics.plugins.sampleService2.loaded).toBe(false)

    await analytics.loadServices()

    expect(analytics.plugins.sampleService1.hooks.load).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.sampleService2.hooks.load).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.sampleService1.loaded).toBe(true)
    expect(analytics.plugins.sampleService2.loaded).toBe(true)
  })

  it('lazily initialize plugins that implement the executed hook', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'identifyService', hooks: ['identify'] }),
        getMockPlugin({ name: 'eventService', hooks: ['event'] }),
        getMockPlugin({ name: 'pageviewService', hooks: ['pageview'] }),
      ],
    })

    await analytics.event({ label: 'click' })

    expect(analytics.plugins.identifyService.loaded).toBe(false)
    expect(analytics.plugins.pageviewService.loaded).toBe(false)
    expect(analytics.plugins.eventService.loaded).toBe(true)

    await analytics.identify({})
    expect(analytics.plugins.identifyService.loaded).toBe(true)
    expect(analytics.plugins.pageviewService.loaded).toBe(false)

    await analytics.pageview()
    expect(analytics.plugins.pageviewService.loaded).toBe(true)
  })

  it('unload all services', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.loadServices()

    expect(analytics.plugins.sampleService1.loaded).toBe(true)
    expect(analytics.plugins.sampleService2.loaded).toBe(true)

    await analytics.unloadServices()

    expect(analytics.plugins.sampleService1.hooks.unload).toHaveBeenCalledTimes(
      1,
    )
    expect(analytics.plugins.sampleService2.hooks.unload).toHaveBeenCalledTimes(
      1,
    )
    expect(analytics.plugins.sampleService1.loaded).toBe(false)
    expect(analytics.plugins.sampleService2.loaded).toBe(false)
  })
})

describe('plugin hooks', () => {
  it('runs "event" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.event({ label: 'click' })

    expect(analytics.plugins.sampleService1.hooks.event).toHaveBeenCalledWith({
      label: 'click',
    })
    expect(analytics.plugins.sampleService2.hooks.event).toHaveBeenCalledWith({
      label: 'click',
    })
  })

  it('runs "pageview" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    analytics.loadServices()
    await analytics.pageview()

    expect(
      analytics.plugins.sampleService1.hooks.pageview,
    ).toHaveBeenCalledWith({
      location: 'http://localhost/',
      page: '/',
      title: '',
    })
    expect(
      analytics.plugins.sampleService2.hooks.pageview,
    ).toHaveBeenCalledWith({
      location: 'http://localhost/',
      page: '/',
      title: '',
    })
  })

  it('runs "pageview" hook with overriden args', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.pageview({
      page: '/potato',
      location: 'http://localhost/potato',
      title: 'potato',
    })

    expect(
      analytics.plugins.sampleService1.hooks.pageview,
    ).toHaveBeenCalledWith({
      page: '/potato',
      location: 'http://localhost/potato',
      title: 'potato',
    })
    expect(
      analytics.plugins.sampleService2.hooks.pageview,
    ).toHaveBeenCalledWith({
      page: '/potato',
      location: 'http://localhost/potato',
      title: 'potato',
    })
  })

  it('runs "identify" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.identify({
      id: 'potato',
    })

    expect(
      analytics.plugins.sampleService1.hooks.identify,
    ).toHaveBeenCalledWith({
      id: 'potato',
    })
    expect(
      analytics.plugins.sampleService2.hooks.identify,
    ).toHaveBeenCalledWith({
      id: 'potato',
    })
  })

  it('runs "anonymize" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.anonymize()

    expect(analytics.plugins.sampleService1.hooks.anonymize).toHaveBeenCalled()
    expect(analytics.plugins.sampleService2.hooks.anonymize).toHaveBeenCalled()
  })

  it('runs "error" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.error({ message: 'Some error' })

    expect(analytics.plugins.sampleService1.hooks.error).toHaveBeenCalledWith({
      message: 'Some error',
    })
    expect(analytics.plugins.sampleService2.hooks.error).toHaveBeenCalledWith({
      message: 'Some error',
    })
  })

  it('runs "warn" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.warn({ message: 'Some warning' })

    expect(analytics.plugins.sampleService1.hooks.warn).toHaveBeenCalledWith({
      message: 'Some warning',
    })
    expect(analytics.plugins.sampleService2.hooks.warn).toHaveBeenCalledWith({
      message: 'Some warning',
    })
  })

  it('runs "info" hook of supported plugins', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'sampleService1' }),
        getMockPlugin({ name: 'sampleService2' }),
      ],
    })

    await analytics.info({ message: 'Some info' })

    expect(analytics.plugins.sampleService1.hooks.info).toHaveBeenCalledWith({
      message: 'Some info',
    })
    expect(analytics.plugins.sampleService2.hooks.info).toHaveBeenCalledWith({
      message: 'Some info',
    })
  })

  it('does not run hook of excluded plugin', async () => {
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

    expect(analytics.plugins.event.hooks.event).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.event).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.event).toHaveBeenCalledTimes(1)

    expect(analytics.plugins.event.hooks.pageview).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.pageview).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.pageview).toHaveBeenCalledTimes(1)

    expect(analytics.plugins.event.hooks.identify).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.identify).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.identify).toHaveBeenCalledTimes(0)
  })

  it('only runs hook of included plugins', async () => {
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

    expect(analytics.plugins.event.hooks.event).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.event).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.event).toHaveBeenCalledTimes(0)

    expect(analytics.plugins.event.hooks.pageview).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.pageview).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.pageview).toHaveBeenCalledTimes(0)

    expect(analytics.plugins.event.hooks.identify).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.identify).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.identify).toHaveBeenCalledTimes(1)
  })

  it('does not run service hook defined to be used only explicitly', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'event' }),
        getMockPlugin({ name: 'pageview' }),
        getMockPlugin({ name: 'identify' }),
      ],
      explicitUse: {
        event: ['event'],
        pageview: ['pageview'],
        identify: ['identify'],
      },
    })

    await analytics.event({ label: 'potato' })
    await analytics.pageview(null)
    await analytics.identify({})

    expect(analytics.plugins.event.hooks.event).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.event).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.event).toHaveBeenCalledTimes(1)

    expect(analytics.plugins.event.hooks.pageview).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.pageview).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.pageview).toHaveBeenCalledTimes(1)

    expect(analytics.plugins.event.hooks.identify).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.identify).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.identify).toHaveBeenCalledTimes(0)
  })

  it('runs explicitly defined service hook', async () => {
    const analytics = Analytics({
      plugins: [
        getMockPlugin({ name: 'event' }),
        getMockPlugin({ name: 'pageview' }),
        getMockPlugin({ name: 'identify' }),
      ],
      explicitUse: {
        event: ['event'],
        pageview: ['pageview'],
        identify: ['identify'],
      },
    })

    await analytics.event({ label: 'potato' }, { include: ['event'] })
    await analytics.pageview(null, { include: ['pageview'] })
    await analytics.identify({}, { include: ['identify'] })

    expect(analytics.plugins.event.hooks.event).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.pageview.hooks.event).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.event).toHaveBeenCalledTimes(0)

    expect(analytics.plugins.event.hooks.pageview).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.pageview).toHaveBeenCalledTimes(1)
    expect(analytics.plugins.identify.hooks.pageview).toHaveBeenCalledTimes(0)

    expect(analytics.plugins.event.hooks.identify).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.pageview.hooks.identify).toHaveBeenCalledTimes(0)
    expect(analytics.plugins.identify.hooks.identify).toHaveBeenCalledTimes(1)
  })

  describe('plugin "this" context', () => {
    it('passes config context to all hooks', async () => {
      const plugin1 = {
        name: 'plugin1',
        load: jest.fn(function load(this: PluginContext) {
          return this
        }),
        unload: jest.fn(function unload(this: PluginContext) {
          return this
        }),
        pageview: jest.fn(function pageview1(this: PluginContext) {
          return this
        }),
      }

      const analytics = Analytics({
        debug: false,
        appVersion: '1.0.0',
        plugins: [plugin1],
      })

      const expectedContext = {
        config: { appVersion: '1.0.0', debug: false, env: undefined },
      }

      await analytics.loadServices()
      await analytics.pageview()
      await analytics.unloadServices()

      expect(plugin1.load).toReturnWith(
        expect.objectContaining(expectedContext),
      )
      expect(plugin1.unload).toReturnWith(
        expect.objectContaining(expectedContext),
      )
      expect(plugin1.pageview).toReturnWith(
        expect.objectContaining(expectedContext),
      )
    })

    it('passes a "assertKeys" helper for each hook', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const plugins = [
        {
          name: 'plugin1' as const,
          load: jest.fn(),
          identify(this: PluginContext, args: GenericObject) {
            this.assertKeys(args, ['id'])

            return this
          },
        },
        {
          name: 'plugin2' as const,
          load: jest.fn(),
          pageview(this: PluginContext, args: GenericObject) {
            this.assertKeys(args, ['url', 'title'])

            return this
          },
        },
      ]

      const analytics = Analytics({ plugins })

      await analytics.identify({})
      await analytics.pageview()

      expect(errorSpy).toHaveBeenCalledWith(
        `[Analytics][plugin:"plugin1"] Hook "identify" requires the properties "id". Received "".`,
      )
      expect(errorSpy).toHaveBeenCalledWith(
        `[Analytics][plugin:"plugin2"] Hook "pageview" requires the properties "url, title". Received "page, location, title".`,
      )

      errorSpy.mockRestore()
    })

    it('passes a "assertValues" helper for each hook', async () => {
      const assertSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const plugins = [
        {
          name: 'plugin1' as const,
          load: jest.fn(),
          identify(this: PluginContext, { id }: GenericObject) {
            this.assertValues({ id })

            return this
          },
        },
        {
          name: 'plugin2' as const,
          load: jest.fn(),
          pageview(this: PluginContext, { url, title }: GenericObject) {
            this.assertValues({ url, title })

            return this
          },
        },
      ]

      const analytics = Analytics({ plugins })

      await analytics.identify({})
      await analytics.pageview()

      expect(assertSpy).toHaveBeenCalledWith(
        `[Analytics][plugin:"plugin1"] Hook "identify" requires defined values for "id" properties. Received "{}".`,
      )
      expect(assertSpy).toHaveBeenCalledWith(
        '[Analytics][plugin:"plugin2"] Hook "pageview" requires defined values for "url, title" properties. Received "{"title":""}".',
      )

      assertSpy.mockRestore()
    })
  })
})

test('only runs actual tracking on environment defined in "trackWhenEnv"', async () => {
  const plugins = [
    getMockPlugin({ name: 'sampleService1' }),
    getMockPlugin({ name: 'sampleService2' }),
  ]

  let analytics = Analytics({
    env: 'not-potato',
    trackWhenEnv: 'potato',
    plugins,
  })

  await analytics.event({ label: 'click' })

  expect(analytics.plugins.sampleService1.hooks.event).not.toHaveBeenCalledWith(
    {
      label: 'click',
    },
  )
  expect(analytics.plugins.sampleService2.hooks.event).not.toHaveBeenCalledWith(
    {
      label: 'click',
    },
  )

  analytics = Analytics({
    env: 'potato',
    trackWhenEnv: 'potato',
    plugins,
  })

  await analytics.event({ label: 'click' })

  expect(analytics.plugins.sampleService1.hooks.event).toHaveBeenCalledWith({
    label: 'click',
  })
  expect(analytics.plugins.sampleService2.hooks.event).toHaveBeenCalledWith({
    label: 'click',
  })
})
