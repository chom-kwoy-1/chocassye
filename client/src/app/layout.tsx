import type {Metadata} from 'next'
import '../index.css'
import React from "react";
import {TranslationProvider} from "@/components/TranslationProvider";
import {RootLayout} from "@/app/rootLayout";

export const metadata: Metadata = {
  title: 'ᄎᆞ자쎠',
  description: 'A Searchable Historical Korean Corpus',
}

export default function RootLayoutWrapper(
  { children }: {
  children: React.ReactNode,
}) {
  return (
    <TranslationProvider>
      <RootLayout>
        {children}
      </RootLayout>
    </TranslationProvider>
  );
}
