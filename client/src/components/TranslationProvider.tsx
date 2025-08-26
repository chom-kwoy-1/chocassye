'use client';
import React, { createContext } from 'react';
import i18next from 'i18next'
import { useTranslation as useTranslationClient } from "../app/i18n/client";
import { useTranslation as useTranslationOrig } from 'react-i18next';

export const TranslationContext = createContext<[string | undefined, (lng: string) => void]>([
  undefined, (lng: string) => {},
]); // fallback value

export function TranslationProvider({ children, defaultLng }: {
  children: React.ReactNode,
  defaultLng?: string,
}) {
  // const { i18n } = useTranslationOrig();
  // console.log("Resolved language:", i18n.resolvedLanguage);
  // const [lng, setLng] = React.useState(i18n.resolvedLanguage?? 'en');
  const [lng, setLng] = React.useState<string | undefined>(defaultLng);
  return (
    <TranslationContext.Provider value={[lng, setLng]}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const [lng, setLng] = React.useContext(TranslationContext);
  return useTranslationClient(lng);
}
