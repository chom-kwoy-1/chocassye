import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { getCookie } from "cookies-next/server";
import { dir } from "i18next";
import { polyfill } from "interweave-ssr";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React from "react";

import App from "@/components/App";
import DarkLightThemeProvider from "@/components/ThemeContext";
import { TranslationProvider } from "@/components/TranslationProvider";
import { THEME_COOKIE_KEY } from "@/components/config";
import { detectLanguage, getTranslation } from "@/components/detectLanguage";

import "./index.css";

polyfill(); // Polyfill for interweave on server side

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return {
    title: t("page-title"),
    description: t("page-description"),
  };
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lng = await detectLanguage();
  const theme = await getCookie(THEME_COOKIE_KEY, { cookies });
  return (
    <html lang={lng} dir={dir(lng)}>
      <body>
        <AppRouterCacheProvider>
          <div id="root">
            <TranslationProvider defaultLng={lng}>
              <DarkLightThemeProvider initialThemeType={theme}>
                <App>{children}</App>
              </DarkLightThemeProvider>
            </TranslationProvider>
          </div>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
