import React from 'react';
import {Wordle} from "./wordlePage";
import {fetchWord} from "./fetchWord";

export default async function WordleRoot() {
  const answer5 = await fetchWord(5, false);
  const answer6 = await fetchWord(6, false);
  return (
    <Wordle
      answer5={answer5}
      answer6={answer6}
    />
  );
}
