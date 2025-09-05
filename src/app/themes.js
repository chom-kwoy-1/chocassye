import { blue, brown, deepOrange, red } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

import { highlightColors } from "@/components/client_utils";

const fonts = [
  "Gugyeol",
  "Source Han Sans KR",
  "Source Han Sans K",
  "Noto Sans CJK KR",
  "NanumBarunGothic YetHangul",
  "나눔바른고딕 옛한글",
  "함초롬돋움 LVT",
  "HCR Dotum LVT",
  "함초롬돋움",
  "HCR Dotum",
  "본고딕",
  "본고딕 KR",
  "sans-serif",
];

// A custom theme for this app
const lightThemeBase = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#465168",
    },
    secondary: {
      main: "#D5EED7",
    },
    background: {
      default: "#e1e8ef",
    },
  },
  typography: {
    fontFamily: fonts.join(","),
    h4: {
      fontSize: "1.6rem",
    },
  },
});

const darkThemeBase = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#e5e5ea",
    },
    secondary: {
      main: "#D5EED7",
    },
    background: {
      default: "#262c39",
      paper: "#262c39",
    },
  },
  typography: {
    fontFamily: fonts.join(","),
    h4: {
      fontSize: "1.6rem",
    },
  },
});

function addCustomComponents(theme) {
  return createTheme(theme, {
    components: {
      MuiCssBaseline: {
        styleOverrides: (themeParam) => {
          let styleSheet = `
            body {
              font-size: 14px;
            }
            
            a {
              color: inherit;
              text-decoration: underline dotted grey;
            }
            a.sourceLink:visited {
              color: ${deepOrange["400"]};
            }
            
            span[orig-tag="anno"] {
              font-size: smaller;
            }
            
            span[data-tone] {
              position: relative;
              margin-top: 10%;
            }
            
            span[data-tone]::after {
              position: absolute;
              width: 200%;
              text-align: center;
              font-size: 0.6em;
              line-height: 1.0;
              transform: translate(-50%, -50%);
              top: 0;
              left: 50%;
              opacity: 0.6;
            }
            
            span[data-tone="H"]::after {
              content: "•";
            }
            
            span[data-tone="R"]::after {
              content: "••";
            }
            
            span[orig-tag="uncertain-tone"] > span[data-tone="L"]::after {
              content: "[ ]";
              color: ${red["400"]};
            }
            span[orig-tag="uncertain-tone"] > span[data-tone="H"]::after {
              content: "[•]";
              color: ${red["400"]};
            }
            span[orig-tag="uncertain-tone"] > span[data-tone="R"]::after {
              content: "[••]";
              color: ${red["400"]};
            }
            
            span[is-tone]::before {
              content: "\\00200c";
            }
            
            span[is-tone] {
              width: 0.001pt;
              display: inline-block;
              position: relative;
              z-index: -100;
              opacity: 0;
            }
            
            .sourceSentence.sentence_type_title .text {
              font-size: 150%;
            }
          `;

          for (const type of ["theme", "dark", "light"]) {
            let isLightMode, ancestorSelector;
            if (type === "theme") {
              isLightMode = themeParam.palette.mode === "light";
              ancestorSelector = "";
            } else {
              isLightMode = type === "light";
              ancestorSelector = `.${type}ThemeRoot `;
            }

            styleSheet += `
              ${ancestorSelector}.sourceSentence.sentence_lang_chi .text,
              ${ancestorSelector}.sourceSentence.sentence_type_chi .text {
                color: ${isLightMode ? blue["900"] : blue["300"]};
              }
              
              ${ancestorSelector}.sourceSentence.sentence_lang_mod .text,
              ${ancestorSelector}.sourceSentence.sentence_type_mod .text {
                color: ${isLightMode ? brown["600"] : brown["200"]};
              }
              
              ${ancestorSelector}.sourceSentence[class*="sentence_type_anno"] .text,
              ${ancestorSelector}.sourceSentence[class*="sentence_type_note"] .text {
                font-size: smaller;
                padding-left: 20pt;
              }
              
              ${ancestorSelector}.text span[orig-tag="g"] {
                font-size: 150%;
                margin-right: 4pt;
                color: ${isLightMode ? blue["900"] : blue["300"]};
              }
              ${ancestorSelector}.text span[orig-tag="m"] {
                margin-right: 4pt;
              }
              ${ancestorSelector}.text span[orig-tag="s"] {
                margin-right: 4pt;
              }
              ${ancestorSelector}.text span[orig-tag="expl"] {
                color: ${isLightMode ? blue["900"] : blue["300"]};
                font-weight: lighter;
              }
            `;
          }

          highlightColors.forEach((color, index) => {
            styleSheet += `
              mark[data-hl-id="${index}"] {
                background-color: ${color[theme.palette.mode === "light" ? "A100" : "300"]};
                color: black;
              }
            `;
          });

          return styleSheet;
        },
      },
    },
  });
}

export const lightTheme = addCustomComponents(lightThemeBase);
export const darkTheme = addCustomComponents(darkThemeBase);
