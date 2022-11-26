import { RawSourceMap } from "source-map";

declare module "async-concat-with-sourcemaps" {
  export default class Concat {
    readonly tmpFile: string;
    constructor(generateSourceMap: boolean, fileName: string, separator?: string, tmpDir?: string);
    add(filePath: string | null, content: string | Buffer, sourceMap?: string | RawSourceMap): Promise<void>;
    content(): Promise<Buffer>;
    sourceMap(): Promise<string | undefined>;
  }
}
