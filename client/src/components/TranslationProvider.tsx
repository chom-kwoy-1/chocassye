'use client';
import React, { createContext } from 'react';
import { useTranslation as useTranslationOrig } from "../app/i18n/client";

export const TranslationContext = createContext<[string, (lng: string) => void]>([
  'en', (lng: string) => {},
]); // fallback value

export function TranslationProvider({ children }: {
  children: React.ReactNode,
}) {
  const [lng, setLng] = React.useState('en');
  return (
    <TranslationContext.Provider value={[lng, setLng]}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const lng = React.useContext(TranslationContext);
  return useTranslationOrig(lng);
}
