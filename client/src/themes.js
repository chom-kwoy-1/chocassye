import {createTheme} from '@mui/material/styles';
import {
    amber, blue, cyan, deepOrange,
    deepPurple, green, indigo,
    lightBlue, lightGreen, lime,
    orange, pink, purple, red, teal, yellow,
    brown
} from '@mui/material/colors';

const fonts = [
    'Gugyeol', 'Source Han Sans KR', 'Source Han Sans K', 'Noto Sans CJK KR', 'NanumBarunGothic YetHangul',
    '나눔바른고딕 옛한글', '함초롬돋움 LVT', 'HCR Dotum LVT', '함초롬돋움', 'HCR Dotum', '본고딕', '본고딕 KR', 'sans-serif'
];

// A custom theme for this app
const lightThemeBase = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#465168',
        },
        secondary: {
            main: '#D5EED7',
        },
        background: {
            default: '#e1e8ef',
        },
    },
    typography: {
        fontFamily: fonts.join(','),
        fontSize: 13,
    },
});

const darkThemeBase = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#e5e5ea',
        },
        secondary: {
            main: '#D5EED7',
        },
        background: {
            default: '#262c39',
            paper: '#262c39',
        },
    },
    typography: {
        fontFamily: fonts.join(','),
        fontSize: 13,
    },
});

function addCustomComponents(theme) {
    return createTheme(theme, {
        components: {
            MuiCssBaseline: {
                styleOverrides: (themeParam) => `
                    a {
                        color: inherit;
                        text-decoration: underline dotted grey;
                    }
                    a.sourceLink:visited {
                        color: ${deepOrange['400']};
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
                        color: ${red['400']};
                    }
                    span[orig-tag="uncertain-tone"] > span[data-tone="H"]::after {
                        content: "[•]";
                        color: ${red['400']};
                    }
                    span[orig-tag="uncertain-tone"] > span[data-tone="R"]::after {
                        content: "[••]";
                        color: ${red['400']};
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
                    
                    .sourceSentence.sentence_type_title {
                        line-height: 30pt;
                    }
                    .sourceSentence.sentence_type_title .text {
                        font-size: 20pt;
                    }
                    
                    .sourceSentence.sentence_lang_chi .text,
                    .sourceSentence.sentence_type_chi .text {
                        color: ${themeParam.palette.mode === 'light'? blue['900'] : blue['300']};
                    }
                    
                    .sourceSentence.sentence_lang_mod .text,
                    .sourceSentence.sentence_type_mod .text {
                        color: ${themeParam.palette.mode === 'light'? brown['600'] : brown['200']};
                    }
                    
                    .sourceSentence[class*="sentence_type_anno"] .text,
                    .sourceSentence[class*="sentence_type_note"] .text {
                        font-size: 13pt;
                        padding-left: 20pt;
                    }
                    
                    .text span[orig-tag="g"] {
                        font-size: 20pt;
                        margin-right: 4pt;
                        color: ${themeParam.palette.mode === 'light'? blue['900'] : blue['300']};
                    }
                    .text span[orig-tag="m"] {
                        margin-right: 4pt;
                    }
                    .text span[orig-tag="s"] {
                        margin-right: 4pt;
                    }
                    .text span[orig-tag="expl"] {
                        color: ${themeParam.palette.mode === 'light'? blue['900'] : blue['300']};
                        font-weight: lighter;
                    }
                `,
            }
        },
    });
}

export const lightTheme = addCustomComponents(lightThemeBase);
export const darkTheme = addCustomComponents(darkThemeBase);
