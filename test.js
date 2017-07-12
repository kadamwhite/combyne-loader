const fs = require('fs');
const path = require('path');

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

  it('correctly loads the template');
});