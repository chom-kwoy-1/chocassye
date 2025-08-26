import type {Metadata} from 'next'
import '../index.css'
import React from "react";
import {TranslationProvider} from "@/components/TranslationProvider";
import {RootLayout} from "@/app/rootLayout";
import { getCookie } from 'cookies-next/server';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'ᄎᆞ자쎠',
  description: 'A Searchable Historical Korean Corpus',
}

export default async function RootLayoutWrapper(
  { children }: {
  children: React.ReactNode,
}) {
  const lng = await getCookie('i18next', {cookies});
  return (
    <TranslationProvider defaultLng={lng}>
      <RootLayout>
        {children}
      </RootLayout>
    </TranslationProvider>
  );
}
