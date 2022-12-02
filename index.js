var { createHash } = require("crypto");
var path = require("path");
var { writeFile, readFile, mkdir } = require("fs/promises");
var { SourceMapGenerator, SourceMapConsumer } = require("source-map");

function unixStylePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function Concat(generateSourceMap, fileName, separator, tmpDir) {
  var hash = createHash("md5").update(String(Math.random())).digest("hex");

  this.useTmp = tmpDir !== undefined;
  this.lineOffset = 0;
  this.columnOffset = 0;
  this.sourceMapping = generateSourceMap;
  this.contentPartsCount = 0;
  this.tmpFile = path.join(tmpDir || "/tmp", `${fileName}.${hash}.concat`);
  this.contentParts = [];

  if (separator === undefined) {
    this.separator = bufferFrom("");
  } else {
    this.separator = bufferFrom(separator);
  }

  if (this.sourceMapping) {
    this._sourceMap = new SourceMapGenerator({ file: unixStylePath(fileName) });
    this.separatorLineOffset = 0;
    this.separatorColumnOffset = 0;
    var separatorString = this.separator.toString();
    for (var i = 0; i < separatorString.length; i++) {
      this.separatorColumnOffset++;
      if (separatorString[i] === "\n") {
        this.separatorLineOffset++;
        this.separatorColumnOffset = 0;
      }
    }
  }
}

Concat.prototype._appendContent = async function (content) {
  if (this.useTmp) {
    await writeFile(this.tmpFile, content, { flag: "a+" });
  } else {
    this.contentParts.push(content);
  }
};

Concat.prototype.add = async function (filePath, content, sourceMap) {
  filePath = filePath && unixStylePath(filePath);

  if (!Buffer.isBuffer(content)) {
    content = bufferFrom(content);
  }

  if (this.contentPartsCount > 0) {
    await mkdir(path.dirname(this.tmpFile), { recursive: true })
    await this._appendContent(this.separator);
  } else {
    await writeFile(this.tmpFile, "");
  }

  await this._appendContent(content);
  this.contentPartsCount++;

  if (this.sourceMapping) {
    var contentString = content.toString();
    var lines = contentString.split("\n").length;

    if (Object.prototype.toString.call(sourceMap) === "[object String]")
      sourceMap = JSON.parse(sourceMap);

    if (sourceMap && sourceMap.mappings && sourceMap.mappings.length > 0) {
      var upstreamSM = new SourceMapConsumer(sourceMap);
      var _this = this;
      upstreamSM.eachMapping(function (mapping) {
        if (mapping.source) {
          _this._sourceMap.addMapping({
            generated: {
              line: _this.lineOffset + mapping.generatedLine,
              column:
                (mapping.generatedLine === 1 ? _this.columnOffset : 0) +
                mapping.generatedColumn,
            },
            original:
              mapping.originalLine == null
                ? null
                : {
                    line: mapping.originalLine,
                    column: mapping.originalColumn,
                  },
            source: mapping.originalLine != null ? mapping.source : null,
            name: mapping.name,
          });
        }
      });

      if (upstreamSM.sourcesContent) {
        upstreamSM.sourcesContent.forEach(function (sourceContent, i) {
          _this._sourceMap.setSourceContent(
            upstreamSM.sources[i],
            sourceContent
          );
        });
      }
    } else {
      if (sourceMap && sourceMap.sources && sourceMap.sources.length > 0)
        filePath = sourceMap.sources[0];

      if (filePath) {
        for (var i = 1; i <= lines; i++) {
          this._sourceMap.addMapping({
            generated: {
              line: this.lineOffset + i,
              column: i === 1 ? this.columnOffset : 0,
            },
            original: {
              line: i,
              column: 0,
            },
            source: filePath,
          });
        }

        if (sourceMap && sourceMap.sourcesContent)
          this._sourceMap.setSourceContent(
            filePath,
            sourceMap.sourcesContent[0]
          );
      }
    }
    if (lines > 1) this.columnOffset = 0;
    if (this.separatorLineOffset === 0)
      this.columnOffset +=
        contentString.length - Math.max(0, contentString.lastIndexOf("\n") + 1);
    this.columnOffset += this.separatorColumnOffset;
    this.lineOffset += lines - 1 + this.separatorLineOffset;
  }
};

Concat.prototype.content = async function () {
  return this.useTmp
    ? readFile(this.tmpFile)
    : Buffer.concat(this.contentParts);
};

Concat.prototype.sourceMap = async function () {
  return this._sourceMap ? this._sourceMap.toString() : undefined;
};

function bufferFrom(content) {
  try {
    return Buffer.from(content);
  } catch (e) {
    if (Object.prototype.toString.call(content) !== "[object String]") {
      throw new TypeError("separator must be a string");
    }
    return new Buffer(content);
  }
}
Concat.bufferFrom = bufferFrom;
Concat.default = Concat;

module.exports = Concat;
