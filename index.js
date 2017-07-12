/* eslint-disable no-console */
const { resolve, join, extname } = require('path');
// var through = require('through2');
var combyne = require('combyne');
var visitCombyne = require('visit-combyne');

var extendsCache = {};

// var extensions = {
//   '.html': 1,
//   '.cmb': 1,
//   '.cmbn': 1,
//   '.combyne': 1,
// };

// var processTemplate = function(templateSource, settings, callback) {
//   var root = settings.root;
//   var template = combyne(templateSource);
//   var extension = settings.extension || '.html';

//   // Find all extend
//   var extend = visitCombyne(template.tree.nodes, function(node) {
//     return node.type === 'ExtendExpression';
//   }).map(function(node) { return node.value; });

//   // Find all partials
//   var partials = visitCombyne(template.tree.nodes, function(node) {
//     return node.type === 'PartialExpression' && !extendsCache[node.value];
//   }).map(function(node) { return node.value; });

//   // Find all filters
//   var filters = visitCombyne(template.tree.nodes, function(node) {
//     return node.filters && node.filters.length;
//   }).map(function(node) {
//     return node.filters.map(function(filter) {
//       return filter.value;
//     }).join(' ');
//   });

//   // Flatten the array
//   if (filters.length) {
//     filters = filters.join(' ').split(' ');
//   }

//   // Filters cannot be so easily inferred location-wise, so assume they are
//   // preconfigured or exist in a filters directory
//   var filtersDir = settings.filtersDir || 'filters';

//   filters.forEach(function(filterName) {
//     // Register the exported function
//     template._filters[filterName] = path.join(root, filtersDir, filterName);
//   });

//   // Map all partials to functions
//   partials.forEach(function(name) {
//     template._partials[name] = path.resolve(path.join(root, name + extension));
//   });

//   // Map all extend to functions
//   extend.forEach(function(render) {
//     var name = render.template;
//     var superTemplate = path.resolve(path.join(root, name + extension));

//     // Pre-cache this template
//     extendsCache[render.partial] = true;

//     // Set the partial to the super template
//     template._partials[name] = superTemplate;
//   });

//   // Augment the template source to include dependencies
//   var lines = template.source.split('\n');

//   partials = Object.keys(template._partials).map(function(name) {
//     const path = template._partials[name].replace(/\\/ig, '/');
//     return '"' + name + '": require("' + path + '")';
//   });

//   filters = Object.keys(template._filters).map(function(name) {
//     const path = template._filters[name].replace(/\\/ig, '/');
//     return '"' + name + '": require("' + path + '")';
//   });

//   // This replaces the partials and filters inline
//   lines[1] = '_partials: {' + partials.join(',') + '},';
//   lines[2] = '_filters: {' + filters.join(',') + '},';

//   // Flatten the template to remove unnecessary `\n` whitespace
//   template.source = lines.join('\n');

//   if (this.push) {
//     this.push('module.exports = ' + template.source);
//   }

//   callback.call(this, template);
// };

// // eslint-disable-next-line no-unused-vars
// function combynify(file, settings) {
//   var fileExtension = path.extname(file);

//   if (settings.extension) {
//     if (fileExtension !== settings.extension) {
//       // File does not match the specified file extension
//       return through();
//     }
//   } else {
//     if (!extensions[fileExtension]) {
//       // File does not match any default supported file extensions
//       return through();
//     }

//     // No extension setting provided, but file matches a supported extension:
//     // use this extension for all subsequent templates
//     settings.extension = fileExtension;
//   }

//   settings = settings || {};

//   // Mimic how the actual Combyne stores
//   settings._filters = {};
//   settings._partials = {};
//   settings.root = settings.root || path.join(process.cwd(), 'views');
//   settings._filepath = file;

//   var chunks = [];

//   function parts(chunk, enc, callback) {
//     chunks.push(chunk); callback();
//   }

//   return through(parts, function(callback) {
//     try {
//       processTemplate.call(this, chunks.join(''), settings, function(/* template */) {
//         callback();
//       });
//     } catch( err ) {
//       // Annotate error with the file in which it originated
//       err.message = err.message + ' in ' + file;
//       throw err;
//     }
//   });
// }

const loaderUtils = require('loader-utils');

// Helper methods
const getOption = (options, option, defaultValue) =>
  (options && options[option]) || defaultValue;

const isExtendExpression = node => node.type === 'ExtendExpression';
const isPartialExpression = node => node.type === 'PartialExpression' && !extendsCache[node.value];
const isFilter = node => node.filters && node.filters.length;

// The loader
module.exports = function(content) {
  this.cacheable && this.cacheable();

  const options = loaderUtils.getOptions(this);

  // Assume a root will be passed in, but fall back to cwd/views to mirror
  // the familiar behavior of the "combynify" browserify transform
  const root = getOption(options, 'root', join(process.cwd(), 'views'));

  // We cannot easily guess where filters will be, so we assume the filters
  // directory is specified explicitly or else located at root/filters
  const filtersDir = getOption(options, 'filtersDir', 'filters');

  // Detect the filename extension, and assume it for all subsequent template
  // requires that do not explicitly specify their own extension
  const extension = extname(this.resourcePath);

  // Apply this file's extension to a fileName if it lacks an extension
  const ensureExtension = fileName => /.\..+$/.test(fileName) ?
    fileName : `${fileName}${extension}`;

  // Compile the template to build the AST
  const template = combyne(content);

  // Find all extend expressions, partials & filters
  const extendNodes = visitCombyne(template.tree.nodes, isExtendExpression);
  const partialNodes = visitCombyne(template.tree.nodes, isPartialExpression);
  const filterNodes = visitCombyne(template.tree.nodes, isFilter);

  filterNodes.forEach((node) => {
    node.filters.forEach((filter) => {
      const filterName = filter.value;
      // Register the exported function
      template._filters[filterName] = join(filtersDir, filterName);
    });
  });

  // Map all partials to functions
  partialNodes.forEach((node) => {
    const name = node.value;
    template._partials[name] = resolve(join(root, ensureExtension(name)));
  });

  // Map all extends to functions
  extendNodes.forEach((node) => {
    const name = node.render.template;
    const superTemplate = resolve(join(root, ensureExtension(name)));

    // Pre-cache this template
    extendsCache[node.render.partial] = true;

    // Set the partial to the super template
    template._partials[name] = superTemplate;
  });

  // Augment the template source to include dependencies
  const lines = template.source.split('\n');

  const partials = Object.keys(template._partials).map((name) => {
    const path = template._partials[name].replace(/\\/ig, '/');
    // return '"' + name + '": require("' + path + '")';
    return `"${ name }": require("${ path }")`;
  });

  const filters = Object.keys(template._filters).map((name) => {
    const path = template._filters[name].replace(/\\/ig, '/');
    // return '"' + name + '": require("' + path + '")';
    return `"${ name }": require("${ path }")`;
  });

  // This replaces the partials and filters inline
  // lines[1] = '_partials: {' + partials.join(',') + '},';
  lines[1] = `_partials: {${ partials.join(',') }},`;
  // lines[2] = '_filters: {' + filters.join(',') + '},';
  lines[2] = `_filters: {${ filters.join(',') }},`;

  // Remove unnecessary whitespace and reinstate line breaks
  template.source = lines.map(str => str.trim()).join('\n');

  this.value = template.source;
  // return `module.exports = ${ JSON.stringify(template.source) }`;
  return `module.exports = ${this.value}`;
};