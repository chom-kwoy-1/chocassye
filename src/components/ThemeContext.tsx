"use client";

import { useMediaQuery } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { setCookie } from "cookies-next";
import React, { createContext } from "react";

import { darkTheme, lightTheme } from "@/app/themes";
import { THEME_COOKIE_KEY } from "@/components/config";

export const ThemeContext = createContext([{}, (_: "light" | "dark") => {}]);

const THEMES = new Map([
  ["light", lightTheme],
  ["dark", darkTheme],
]);

export default function DarkLightThemeProvider({
  children,
  initialThemeType,
}: {
  children: React.ReactNode;
  initialThemeType: string | undefined;
}) {
  let initialTheme = lightTheme;
  if (
    initialThemeType !== undefined &&
    ["light", "dark"].includes(initialThemeType)
  ) {
    initialTheme = THEMES.get(initialThemeType)!;
  }
  const [curTheme, setCurTheme] = React.useState(initialTheme);
  const [isThemeArtificallySet, setIsThemeArtificallySet] = React.useState(
    initialThemeType !== undefined,
  );

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const preferredTheme = prefersDarkMode ? darkTheme : lightTheme;
  if (!isThemeArtificallySet && preferredTheme !== curTheme) {
    setCurTheme(preferredTheme);
    setCookie(THEME_COOKIE_KEY, prefersDarkMode ? "dark" : "light");
  }

  const setTheme = React.useCallback((theme: "light" | "dark") => {
    setCurTheme(theme === "dark" ? darkTheme : lightTheme);
    setIsThemeArtificallySet(true);
    setCookie(THEME_COOKIE_KEY, theme);
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
