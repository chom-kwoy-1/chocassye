import { phonemize } from "phonemize";

import { convert, normalizeIPA, wordlist } from "@/utils/convert_eng";

function assert(a: string, b: string) {
  if (a !== b) {
    console.error(`[FAIL] ${a} is not equal to ${b}`);
    console.dir(a);
  } else {
    console.log("[PASS]");
  }
}

assert(await convert("easy"), "의즤");
assert(await convert("near"), "니으");
assert(await convert("square"), "쓰꿰으");
assert(await convert("palm"), "파음");
assert(await convert("nurse"), "너으쓰");
assert(await convert("thought"), "소으트");
assert(await convert("cure"), "큐으");
assert(await convert("city"), "씨틔");
assert(await convert("bottle"), "뽀털");
assert(await convert("calminged"), "카으밍드");
assert(await convert("justify"), "쩌쓰티파이");
assert(await convert("balled"), "뽀을드");
assert(await convert("lake"), "레이크");
assert(await convert("hello"), "헬러우");
assert(await convert("call"), "코을");
assert(await convert("water"), "우오으터");

assert(await convert("May I have some water?"), "메이 아이 하브 썸 우오으터?");
assert(
  await convert("Are you going to New York?"),
  "아으 이으우 꺼우잉 트우 니으우 요으크?",
);
assert(await convert("Arco"), "아으커우");

let cnt = 0;
for (const [word, phons] of wordlist.entries()) {
  const ipa = phonemize(word, {
    returnArray: true,
    format: "ipa",
    stripStress: false,
  })[0].phoneme;
  const normPhons = phons.map((p) =>
    p.replaceAll("ʌ", "ə").replaceAll("\u0301", ""),
  );
  const normIpa = normalizeIPA(ipa)
    .replaceAll("ʌ", "ə")
    .replaceAll("\u0301", "");
  if (!normPhons.includes(normIpa)) {
    // console.log(word, ipa, normIpa, normPhons);
    cnt += 1;
  }
}
console.log(`Incorrect matches: ${cnt}/${wordlist.size}`);
