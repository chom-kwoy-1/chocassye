// @ts-ignore
import {make_ngrams} from "../utils/ngram.js";
// @ts-ignore
import {insert_documents} from "../scripts/parse.js";
import {find_candidate_ids} from "../utils/regex_index.js";


async function make_db(num_data: number): Promise<[string[], Map<string, number[]>]> {
  const BATCH_SIZE = 16;

  const all_sentences: string[] = [];
  const ngram_map: Map<string, number[]> = new Map();

  function insert_into_db(book_details: any, sentences: any[]) {
    for (const sentence of sentences) {
      const sentence_id = all_sentences.length;
      all_sentences.push(sentence.text);

      const ngram_3 = make_ngrams(sentence.text, 3);
      for (const ch of ngram_3) {
        if (!ngram_map.has(ch)) {
          ngram_map.set(ch, []);
        }
        ngram_map.get(ch)!.push(sentence_id);
      }
    }
  }

  return insert_documents(insert_into_db, BATCH_SIZE, num_data)
    .then(() => {
      console.log("All sentences collected:", all_sentences.length);
      return [all_sentences, ngram_map];
    });
}

async function test() {
  const [sentences, ngram_map] = await make_db(50);

  const regex = /[ou]?[nl]q?\.tt?[ae]y|w[ou]\.t[ou]y|tol\..h/g;

  // find all sentences that match the regex
  const matching_sids = sentences
    .map((sentence, sid) => ({sentence: sentence, sid: sid}))
    .filter(({sentence, sid}) => regex.test(sentence))
    .map(({sentence, sid}) => sid);
  console.log("Matching sentences:", matching_sids.length);

  const final_ids = find_candidate_ids(regex, ngram_map, false);
  console.log("Final matching sentence ids:", final_ids.size);
  console.log("Overestimated by ", final_ids.size / matching_sids.length, "times");

  // Check if the final_ids contains all matching_sids
  let missing_count = 0;
  for (const sid of matching_sids) {
    if (!final_ids.has(sid)) {
      missing_count++;
      console.error(`Missing sentence ID: ${sid}`);
    }
  }

  if (missing_count > 0) {
    console.error(`Total missing IDs: ${missing_count}`);
  }
  else {
    console.log("All matching sentence IDs found in final_ids.");
  }
}

await test();
