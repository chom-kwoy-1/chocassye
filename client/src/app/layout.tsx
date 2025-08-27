import React from "react";
import '../index.css';
import type {Metadata} from 'next';
import {TranslationProvider} from "@/components/TranslationProvider";
import { getCookie } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { dir } from "i18next";
import { fallbackLng, languages } from "@/app/i18n/settings";
import {AppRouterCacheProvider} from "@mui/material-nextjs/v15-appRouter";
import MyThemeProvider from "@/components/ThemeContext";
import App from "@/components/App";

export const metadata: Metadata = {
  title: 'ᄎᆞ자쎠',
  description: 'A Searchable Historical Korean Corpus',
}

async function detectLanguage() {
  // Determine the user's language preference from cookies or headers
  let lng = await getCookie('i18next', {cookies});
  if (lng === undefined || lng === 'undefined') {
    const acceptLanguage = (await headers()).get('Accept-Language');
    lng = acceptLanguage?.split(',')[0]?.split('-')[0]; // Take the first language preference
  }
  if (lng === undefined || !languages.includes(lng)) {
    lng = fallbackLng; // default to English if no preference is found
  }
  return lng;
}

export default async function Layout(
  { children }: {
  children: React.ReactNode,
}) {
  const lng = await detectLanguage();
  return (
    <html lang={lng} dir={dir(lng)}>
    <body>
      <div id="root">
        <TranslationProvider defaultLng={lng}>
          <AppRouterCacheProvider>
            <MyThemeProvider>
              <App>
                {children}
              </App>
            </MyThemeProvider>
          </AppRouterCacheProvider>
        </TranslationProvider>
      </div>
    </body>
    </html>
  );
}
