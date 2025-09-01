import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { getCookie } from "cookies-next/server";
import { dir } from "i18next";
import { polyfill } from "interweave-ssr";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import React from "react";

import { fallbackLng, languages } from "@/app/i18n/settings";
import App from "@/components/App";
import DarkLightThemeProvider from "@/components/ThemeContext";
import { TranslationProvider } from "@/components/TranslationProvider";
import { THEME_COOKIE_KEY } from "@/components/config";

import "./index.css";

polyfill(); // Polyfill for interweave on server side

export const metadata: Metadata = {
  title: "ᄎᆞ자쎠",
  description: "A Searchable Historical Korean Corpus",
};

async function detectLanguage() {
  // Determine the user's language preference from cookies or headers
  let lng = await getCookie("i18next", { cookies });
  if (lng === undefined || lng === "undefined") {
    const acceptLanguage = (await headers()).get("Accept-Language");
    lng = acceptLanguage?.split(",")[0]?.split("-")[0]; // Take the first language preference
  }
  if (lng === undefined || !languages.includes(lng)) {
    lng = fallbackLng; // default to English if no preference is found
  }
  return lng;
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
