import {promisify} from "util";
import fs from "fs";
import glob from "glob";

export async function loadNgramIndex(dirName: string):
  Promise<[Map<string, number[]>, Map<string, number[]>]> {
  return await promisify(glob)(`${dirName}/idx*.txt`)
    .then(async (files: string[]) => {
      if (files.length === 0) {
        throw new Error(`No index files found in directory: ${dirName}`);
      }
      const ngrams = new Map<string, number[]>();
      const ngramsNoSep = new Map<string, number[]>();
      let idx = 0;
      for (const file of files) {
        idx += 1;
        if (idx % 100 === 0 || idx === files.length) {
          console.log(`Loading file ${idx}/${files.length}`);
        }
        const json = await promisify(fs.readFile)(file, "utf8");
        const data: Map<string, [number, string][]> = JSON.parse(json);
        for (const [ngram, ids] of Object.entries(data)) {
          for (const [id, kind] of ids) {
            const table = kind === 't' ? ngrams : ngramsNoSep;
            if (!table.has(ngram)) {
              table.set(ngram, []);
            }
            table.get(ngram)!.push(id);
          }
        }
      }
      return [ngrams, ngramsNoSep];
    });
}
