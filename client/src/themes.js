import {createTheme} from '@mui/material/styles';

const fonts = [
    'Gugyeol', 'Source Han Sans KR', 'Source Han Sans K', 'Noto Sans CJK KR', 'NanumBarunGothic YetHangul',
    '나눔바른고딕 옛한글', '함초롬돋움 LVT', 'HCR Dotum LVT', '함초롬돋움', 'HCR Dotum', '본고딕', '본고딕 KR', 'sans-serif'
];

// A custom theme for this app
export const lightTheme = createTheme({
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
    },
});

export const darkTheme = createTheme({
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
    },
});
