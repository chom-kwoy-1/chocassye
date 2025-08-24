'use client'
import {useMediaQuery} from "@mui/material";
import React from "react";
import {darkTheme, lightTheme} from "@/themes";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import {ThemeContext} from "@/components/ThemeContext";


export default function MyThemeProvider({ children, }: {
  children: React.ReactNode
}) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  let [curTheme, setCurTheme] = React.useState(prefersDarkMode? darkTheme : lightTheme);
  return (
    <ThemeContext.Provider value={[ curTheme, setCurTheme ]}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={curTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
}
