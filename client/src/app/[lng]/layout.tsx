import type { Metadata } from 'next'
import '../../index.css'
import React from "react";
import MyThemeProvider from "@/components/theme-provider";
import App from "@/components/App";
import { dir } from 'i18next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { TranslationProvider } from "@/components/TranslationProvider";

const languages = ['en', 'ko'];

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }));
}

export const metadata: Metadata = {
  title: 'ᄎᆞ자쎠',
  description: 'A Searchable Historical Korean Corpus',
}

export default async function RootLayout(
  { children, params }: {
  children: React.ReactNode,
  params: Promise<{ lng: string }>,
}) {
  const { lng } = await params;
  return (
    <html lang={lng} dir={dir(lng)}>
    <body>
      <AppRouterCacheProvider>
        <div id="root">
          <MyThemeProvider>
            <TranslationProvider lng={lng}>
              <App>
                {children}
              </App>
            </TranslationProvider>
          </MyThemeProvider>
        </div>
      </AppRouterCacheProvider>
    </body>
    </html>
  );
}
