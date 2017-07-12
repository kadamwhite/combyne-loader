# [Combyne](https://github.com/tbranyen/combyne) loader for [Webpack](https://webpack.js.org)

Loads and compiles templates using the [Combyne](https://github.com/tbranyen/combyne) template engine.

Compatible with Node 6.4 or greater, and Webpack 2 or greater.

## Usage

Basic configuration:
```js
  module: {
    rules: [
      {
        // Transform requires with the file name extension .combyne
        test: /\.combyne$/,
        use: [
          'combyne-loader',
        ],
      },
    ],
  },
```


Advanced configuration:
```js

  module: {
    rules: [
      {
        // Expect template files to have the extension .tmpl
        test: /\.tmpl$/,
        use: [
          {
            loader: 'combyne-loader',
            options: {
              // Specify a custom directory for use resolving partial expressions
              root: resolve(__dirname, 'templates'),
              // Specify a custom directory for use resolving filter expressions
              filtersDir: resolve(__dirname, 'template-filters'),
            },
          },
        ],
      },
    ],
  },
```

See the [Webpack documentation on using loaders](https://webpack.js.org/concepts/loaders/#using-loaders) for more information.

### Loader Options

**`root`:** provide a base directory in which Combyne should look for partials included without a relative path.

The existence of a root directory enables templates to specify _e.g._ `{%partial sometemplate %}`, where `sometemplate` exists in the directory specified by `root`.

This option expects an absolute path to the root template directory, and defaults to `path.resolve( process.cwd(), 'views' )`.

Note that not all templates must be in this root folder: it is primarily for use in resolving references to partials. You can `require()` a Combyne template from anywhere in your JS.

**`filtersDir`:** provide a directory in which Combyne should look for template filter methods.

Filter expressions can be used in Combyne templates, _e.g._ `{{ someContextVal | lowercase | reverse }}` (to reverse & lowercase the `someContextVal` string). In order for this terse syntax to work, combyne-loader must know where to look for the referenced filters, each of which is defined as its own JS module.

This option expects an absolute path to the directory where filter modules can be found, and defaults to `path.resolve( root, 'filters' )`.

## Credit & License

This project is heavily indebted to [@tbranyen](https://github.com/tbranyen)'s [combynify](https://github.com/tbranyen/combynify) Browserify transform, from which most of the parsing code has been borrowed. Additional gratitude is due to [@mzgoddard](https://github.com/mzgoddard) for code review & implementation guidance.

combyne-loader is released under the [MIT License](./LICENSE).