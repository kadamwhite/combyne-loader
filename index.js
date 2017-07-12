/* eslint-disable no-console */
const { resolve, join, extname } = require('path');
// var through = require('through2');
var combyne = require('combyne');
var visitCombyne = require('visit-combyne');

var extendsCache = {};

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
    return `"${ name }": require("${ path }")`;
  });

  const filters = Object.keys(template._filters).map((name) => {
    const path = template._filters[name].replace(/\\/ig, '/');
    return `"${ name }": require("${ path }")`;
  });

  // This replaces the partials and filters inline
  lines[1] = `_partials: {${ partials.join(',') }},`;
  lines[2] = `_filters: {${ filters.join(',') }},`;

  // Remove unnecessary whitespace and reinstate line breaks
  template.source = lines.map(str => str.trim()).join('\n');

  this.value = template.source;
  return `module.exports = ${this.value}`;
};