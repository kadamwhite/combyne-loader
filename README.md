# [Combyne](https://github.com/tbranyen/combyne) loader for [Webpack](https://webpack.js.org)

Loads and compiles templates using the [Combyne](https://github.com/tbranyen/combyne) template engine; very much a work-in-progress.

Sample configuration:
```js

  module: {
    rules: [
      {
        test: /\.tmpl$/,
        use: [
          {
            loader: 'combyne-loader',
            options: {
              root: resolve(__dirname, 'views'),
            },
          },
        ],
        exclude: /node_modules/,
      },
  },
```

See the [Webpack documentation on using loaders](https://webpack.js.org/concepts/loaders/#using-loaders) for more information.