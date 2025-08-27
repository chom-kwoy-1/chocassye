'use client';
import React from "react";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v15-appRouter";
import MyThemeProvider from "@/components/ThemeContext";
import App from "@/components/App";

export function RootLayout(
  {children}: {
    children: React.ReactNode,
  }) {
  return (
    <AppRouterCacheProvider>
      <div id="root">
        <MyThemeProvider>
          <App>
            {children}
          </App>
        </MyThemeProvider>
      </div>
    </AppRouterCacheProvider>
  );
}