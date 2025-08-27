'use server';
import fs from "fs";
import path from "path";
import Rand from "rand-seed";
import {promisify} from "node:util";

const wordlist5: string[] = [];
await promisify(fs.readFile)(path.join(process.cwd(), '../chocassye-corpus/wordle5.txt'), 'utf8')
  .then(data => {
    // split by new line and remove empty lines
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      wordlist5.push(line);
    }
    console.log(`Loaded ${wordlist5.length} words from wordle5.txt`);
  })
  .catch(err => {
    console.error('Error reading wordle5.txt:', err);
  });

const wordlist6: string[] = [];
await promisify(fs.readFile)(path.join(process.cwd(), '../chocassye-corpus/wordle6.txt'), 'utf8')
  .then(data => {
    // split by new line and remove empty lines
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      wordlist6.push(line);
    }
    console.log(`Loaded ${wordlist6.length} words from wordle6.txt`);
  })
  .catch(err => {
    console.error('Error reading wordle6.txt:', err);
  });

export async function fetchWord(
  numCols: number,
  isPractice: boolean
): Promise<{status: string, todayNum: number, word: string}> {
  // Get current timestamp
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | Wordle request`);

  const wordlist = numCols === 5 ? wordlist5 : wordlist6;
  const seedAdd = numCols === 5 ? "..." : "";

  if (isPractice) {
    const index = Math.floor(Math.random() * (wordlist.length - 1));
    const word = wordlist[index];
    console.log(`Practice word (${numCols}): ${word}`);
    return {
      status: "success",
      todayNum: -1, // -1 indicates practice mode
      word: word,
    };
  }
  else {
    // Get today's number (offset from 2025-08-04)
    const today = new Date();
    const startDate = new Date('2025-08-04 GMT+0900');
    const diffTime = today.getTime() - startDate.getTime();
    const todayNum = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Today's number (${numCols}): ${todayNum}`);

    // randomly select a word from the wordlist using the today's number as seed
    const rand = new Rand(todayNum.toString() + seedAdd);
    let index = Math.floor(rand.next() * (wordlist.length - 1));
    let word;
    do {
      word = wordlist[index];
      index = (index + 1) % wordlist.length;
    } while (word.startsWith('#'));

    console.log(`Today's word (${numCols}): ${word}`);

    return {
      status: "success",
      todayNum: todayNum,
      word: word,
    };
  }
}

export async function checkWord(
  numCols: number,
  word: string,
): Promise<{status: "success", included: boolean} | {status: "error", msg: string}> {
  // Get current timestamp
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} | Wordle check request`);

  const wordlist = numCols === 5 ? wordlist5 : wordlist6;

  if (word === undefined) {
    return {
      status: "error",
      msg: "Invalid word"
    };
  }

  // Check if the word is in the wordlist
  return {
    status: "success",
    included: wordlist.includes(word)
  };
}
