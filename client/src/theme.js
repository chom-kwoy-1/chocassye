import { red } from '@mui/material/colors';
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
    fontFamily: "'Gugyeol','함초롬돋움 LVT','HCR Dotum LVT','함초롬돋움','HCR Dotum', 'Source Han Sans KR','본고딕','Source Han Sans K','본고딕 KR', 'NanumBarunGothic YetHangul','나눔바른고딕 옛한글', 'Noto Sans CJK KR', 'sans-serif'",
  },
});

export default theme;
