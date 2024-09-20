import { createTheme } from '@mui/material/styles';

// A custom theme for this app
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4e342e',
    },
    secondary: {
      main: '#ff3d00',
    },
  },
  typography: {
    fontFamily: "'Gugyeol','Source Han Sans KR','Source Han Sans K', 'Noto Sans CJK KR', 'NanumBarunGothic YetHangul','나눔바른고딕 옛한글', '함초롬돋움 LVT','HCR Dotum LVT','함초롬돋움','HCR Dotum', '본고딕','본고딕 KR', 'sans-serif'",
  },
});

export default theme;
