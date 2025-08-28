import React from "react";

import { fetchWord } from "./fetchWord";
import { Wordle } from "./wordlePage";

export default async function WordleRoot() {
  const answer5 = await fetchWord(5, false);
  const answer6 = await fetchWord(6, false);
  return <Wordle answer5={answer5} answer6={answer6} />;
}
