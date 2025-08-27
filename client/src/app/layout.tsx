import React from "react";
import '../index.css';
import type {Metadata} from 'next';
import {TranslationProvider} from "@/components/TranslationProvider";
import {RootLayout} from "@/app/rootLayout";
import { getCookie } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';
import { dir } from "i18next";
import { fallbackLng, languages } from "@/app/i18n/settings";

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
  let lng = await detectLanguage();
  return (
    <html lang={lng} dir={dir(lng)}>
    <body>
      <TranslationProvider defaultLng={lng}>
        <RootLayout>
          {children}
        </RootLayout>
      </TranslationProvider>
    </body>
    </html>
  );
}
