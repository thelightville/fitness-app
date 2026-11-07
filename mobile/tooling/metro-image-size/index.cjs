const { readFileSync } = require('node:fs');
const { imageSize } = require('image-size-core');

// Metro 0.87 accepts the old path-or-buffer API. The patched parser takes bytes.
module.exports = function getImageSize(input) {
  return imageSize(typeof input === 'string' ? readFileSync(input) : input);
};
