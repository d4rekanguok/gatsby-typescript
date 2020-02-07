// babel is used purely for jest
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: true },
      },
    ],
    ['@babel/preset-typescript'],
  ],
}
