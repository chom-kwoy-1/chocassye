"use client";

import { Stack } from "@mui/material";
import React from "react";

import { convertEngToHang } from "@/app/english/convert";

export function EnglishClient() {
  const [englishInput, setEnglishInput] = React.useState("What is this?");
  const [hangulOutput, setHangulOutput] = React.useState("우오티즈디쓰");

  async function handleHangulChange(newText: string) {
    setEnglishInput(newText);
    const result = await convertEngToHang(newText);
    setHangulOutput(result);
  }

  return (
    <Stack>
      <h1>참괴로운 영어표기법 변환기</h1>
      {/*영어 입력 */}
      <textarea
        value={englishInput}
        onChange={(event) => handleHangulChange(event.target.value)}
      />
      {/*한글 출력 */}
      <div>↓</div>
      <div>{hangulOutput}</div>
    </Stack>
  );
}
