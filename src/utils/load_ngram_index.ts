import fs from "fs";
import { glob } from "glob";
import { Packr } from "msgpackr";
import { promisify } from "util";

export type NgramMaps = {
  common: Map<string, number[]>;
  sep: Map<string, number[]>;
  nosep: Map<string, number[]>;
};

async function loadFiles(
  dirName: string,
  prefix: string,
): Promise<Map<string, number[]>> {
  const files = await glob(`${dirName}/${prefix}_*.bin`);
  if (files.length === 0) {
    throw new Error(
      `No index files found in directory: ${dirName}/${prefix}_*.bin`,
    );
  }
  const result: Map<string, number[]> = new Map();
  const packr = new Packr();
  const truncate = parseInt(process.env.NGRAM_TRUNCATE || "-1"); // For testing purposes
  let fileCount = 0;
  for (const file of files) {
    fileCount++;
    if (truncate > 0 && fileCount > truncate) {
      break;
    }
    if (fileCount % 100 === 0) {
      console.log(`Processing ${prefix} file ${fileCount}/${files.length}`);
    }
    const data = await promisify(fs.readFile)(file);
    const unpacked: Map<string, number[]> = packr.unpack(data);
    for (const [key, value] of unpacked.entries()) {
      if (result.has(key)) {
        result.get(key)?.push(...value);
      } else {
        result.set(key, value);
      }
    }
  }
  return result;
}

export async function loadNgramIndex(dirName: string): Promise<NgramMaps> {
  const ngram_map_common = await loadFiles(dirName, "common");
  const ngram_map_sep = await loadFiles(dirName, "sep");
  const ngram_map_nosep = await loadFiles(dirName, "nosep");

  return {
    common: ngram_map_common,
    sep: ngram_map_sep,
    nosep: ngram_map_nosep,
  };
}
