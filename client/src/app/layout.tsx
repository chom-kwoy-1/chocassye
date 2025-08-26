import type {Metadata} from 'next'
import '../index.css'
import React from "react";
import {TranslationProvider} from "@/components/TranslationProvider";
import {RootLayout} from "@/app/rootLayout";
import { getCookie } from 'cookies-next/server';
import { cookies, headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'ᄎᆞ자쎠',
  description: 'A Searchable Historical Korean Corpus',
}

async function detectLanguage() {
  // Determine the user's language preference from cookies or headers
  let lng = await getCookie('i18next', {cookies});
  if (lng === undefined) {
    const acceptLanguage = (await headers()).get('Accept-Language');
    lng = acceptLanguage?.split(',')[0]; // Take the first language preference
  }
  if (lng === undefined) {
    lng = 'en'; // default to English if no preference is found
  }
  return lng;
}

export default async function RootLayoutWrapper(
  { children }: {
  children: React.ReactNode,
}) {
  let lng = await detectLanguage();
  return (
    <TranslationProvider defaultLng={lng}>
      <RootLayout>
        {children}
      </RootLayout>
    </TranslationProvider>
  );
}
