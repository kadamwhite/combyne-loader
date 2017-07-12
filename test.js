const fs = require('fs');
const path = require('path');

const combyneLoader = require('./');

describe('base spec', () => {
  let template;

  beforeAll((done) => {
    fs.readFile(path.join(__dirname, 'sample.tmpl'), (err, data) => {
      template = data.toString();
      done();
    });
  });

  it('loads the template string (canary)', () => {
    expect(typeof template).toEqual('string');
    expect(template.length).toBeGreaterThan(0);
  });

  it('exports a function', () => {
    expect(combyneLoader).toBeDefined();
    expect(typeof combyneLoader).toEqual('function');
    expect(combyneLoader).toBeInstanceOf(Function);
  });

  it('exports a module definition string', () => {
    const result = combyneLoader.apply(Object.freeze({
      resourcePath: __dirname + 'sample.tmpl',
      query: {
        filtersDir: __dirname,
        root: __dirname,
      },
    }), [template]);
    expect(result.substr(0, 17)).toEqual('module.exports = ');
  });

  it('correctly generates a template object', () => {
    const result = combyneLoader.apply(Object.freeze({
      resourcePath: __dirname + 'sample.tmpl',
      query: {
        filtersDir: __dirname,
        root: __dirname,
      },
    }), [template]);
    expect(result.substr(17)).not.toEqual('undefined');
  });

  it('adds require calls for filters', () => {
    const result = combyneLoader.apply(Object.freeze({
      resourcePath: 'sample.tmpl',
      query: {
        root: __dirname,
      },
    }), [template]);
    expect(/require\("[^"]+filters\/last"/.test(result)).toBe(true);
    expect(/require\("[^"]+filters\/get"/.test(result)).toBe(true);
  });

  it('infers extension for extensionless partials from resourcePath', () => {
    const result = combyneLoader.apply(Object.freeze({
      resourcePath: 'sample.combyne',
      query: {
        root: __dirname,
      },
    }), [template]);
    expect(/require\("[^"]+nested.combyne"/.test(result)).toBe(true);
  });

  it('does not override extensions for partials which already have them', () => {
    const result = combyneLoader.apply(Object.freeze({
      resourcePath: 'sample.combyne',
      query: {
        root: __dirname,
      },
    }), [template]);
    expect(/require\("[^"]+tmpl\.tmpl"/.test(result)).toBe(true);
  });
});