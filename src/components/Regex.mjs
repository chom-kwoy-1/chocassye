import escapeStringRegexp from "escape-string-regexp";

import { hangul_to_yale } from "./YaleToHangul.mjs";

export function searchTerm2Regex(text, ignoreSep = false) {
  if (text.length >= 2 && text.startsWith("/") && text.endsWith("/")) {
    let regexText = text.substring(1, text.length - 1);
    return new RegExp(regexText, "g");
  }

  text = hangul_to_yale(text);

  let strippedText = text;
  if (text.startsWith("^")) {
    strippedText = strippedText.substring(1);
  }
  if (text.endsWith("$")) {
    strippedText = strippedText.substring(0, strippedText.length - 1);
  }
  function applyIgnoreSep(s) {
    if (ignoreSep) {
      s = s.replace(/[ .^]/g, "");
    }
    return s;
  }
  let regex = "";
  let isEscaping = false;
  for (let i = 0; i < strippedText.length; i++) {
    if (strippedText[i] === "%" && !isEscaping) {
      regex += ".*?";
      continue;
    }
    if (strippedText[i] === "_" && !isEscaping) {
      regex += ".";
      continue;
    }
    if (isEscaping) {
      isEscaping = false;
      regex += escapeStringRegexp(applyIgnoreSep(strippedText[i]));
      continue;
    }
    if (strippedText[i] === "\\") {
      isEscaping = true;
      continue;
    }
    regex += escapeStringRegexp(applyIgnoreSep(strippedText[i]));
  }
  if (text.startsWith("^")) {
    regex = `^${regex}`;
  }
  if (text.endsWith("$")) {
    regex = `${regex}$`;
  }

  return new RegExp(regex, "g");
}
