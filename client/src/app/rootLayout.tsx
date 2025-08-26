'use client';
import React from "react";
import {TranslationContext} from "@/components/TranslationProvider";
import {dir} from "i18next";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v15-appRouter";
import MyThemeProvider from "@/components/theme-provider";
import App from "@/components/App";

export function RootLayout(
  {children}: {
    children: React.ReactNode,
  }) {
  const lng = React.useContext(TranslationContext);
  return (
    <html lang={lng} dir={dir(lng)}>
    <body>
    <AppRouterCacheProvider>
      <div id="root">
        <MyThemeProvider>
          <App>
            {children}
          </App>
        </MyThemeProvider>
      </div>
    </AppRouterCacheProvider>
    </body>
    </html>
  );
}