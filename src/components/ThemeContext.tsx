"use client";

import { Theme, useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import React, { createContext } from "react";

import { darkTheme, lightTheme } from "@/themes";

export const ThemeContext = createContext([{}, (value: Theme) => {}]);

export default function MyThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [curTheme, setCurTheme] = React.useState(lightTheme);
  const [isThemeArtificallySet, setIsThemeArtificallySet] =
    React.useState(false);

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = prefersDarkMode ? darkTheme : lightTheme;
  if (!isThemeArtificallySet && preferredTheme !== curTheme) {
    setCurTheme(preferredTheme);
  }

  const setTheme = React.useCallback((theme: Theme) => {
    setCurTheme(theme);
    setIsThemeArtificallySet(true);
  }, []);

  return (
    <ThemeContext.Provider value={[curTheme, setTheme]}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={curTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
}
