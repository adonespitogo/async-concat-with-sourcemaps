## Asynchronous concat with source maps [![NPM version][npm-image]][npm-url] [![build status][travis-image]][travis-url] [![Test coverage][coveralls-image]][coveralls-url]

NPM module for concatenating files and generating source maps.

### Advantage over `concat-with-sourcemaps`

The original `concat-with-sourcemaps` module uses system memory (RAM) to store the concatencated files. While it makes concatenation fast,
this can be a problem for machines with less RAM. This module addresses this problem by (optionally) storing the concatenated contents into a temporary
file while allowing the Node.js's garbage collector to free some memory used in storing the file contents.

### Installation

```
npm i async-concat-with-sourcemaps
```

### Usage example

```js
async function usingAsyncConcat() {
  // store concatenated file in /tmp directory
  var concat = new Concat(true, 'all.js', '\n', '/tmp');
  await concat.add(null, "// (c) John Doe");
  await concat.add('file1.js', file1Content);
  await concat.add('file2.js', file2Content, file2SourceMap);

  var concatenatedContent = await concat.content();
  var sourceMapForContent = await concat.sourceMap();
}
```

### API

#### new Concat(generateSourceMap, outFileName, separator)

Initialize a new concat object.

Parameters:

- generateSourceMap: whether or not to generate a source map (default: false)
- outFileName: the file name/path of the output file (for the source map)
- separator: the string that should separate files (default: no separator)
- tmpDir: (optional) directory used to store concatencated files. Passing `undefined` will use system memory.

#### concat.add(fileName, content, sourceMap)

Add a file to the output file. Returns a `Promise<void>`.

Parameters:

- fileName: file name of the input file (can be null for content without a file reference, e.g. a license comment)
- content: content (Buffer or string) of the input file
- sourceMap: optional source map of the input file (string). Will be merged into the output source map.

#### concat.content()

The resulting concatenated file content (Buffer). Returns a `Promise<Buffer>`.

#### concat.sourceMap()

The resulting source map of the concatenated files (string). Returns a `Promise<string | undefined>`.

[coveralls-image]: https://img.shields.io/coveralls/adonespitogo/async-concat-with-sourcemaps.svg
[coveralls-url]: https://coveralls.io/r/adonespitogo/async-concat-with-sourcemaps?branch=master
[npm-image]: https://img.shields.io/npm/v/async-concat-with-sourcemaps.svg
[npm-url]: https://www.npmjs.com/package/async-concat-with-sourcemaps
[travis-image]: https://img.shields.io/travis/adonespitogo/async-concat-with-sourcemaps.svg
[travis-url]: https://travis-ci.org/adonespitogo/async-concat-with-sourcemaps
