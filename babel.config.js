module.exports = {
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        loose: true,
        targets: { esmodules: true },
      },
    ],
  ],
}
