module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        modules: process.env.NODE_ENV === 'test' ? 'auto' : false,
        bugfixes: true,
        loose: true,
        targets: { esmodules: true },
      },
    ],
  ],
}
