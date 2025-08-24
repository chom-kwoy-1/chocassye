'use client';
import React, { createContext } from 'react';

export const TranslationContext = createContext('en');

export function TranslationProvider({ children, lng }: {
  children: React.ReactNode,
  lng: string,
}) {
  return (
    <TranslationContext.Provider value={lng}>
      {children}
    </TranslationContext.Provider>
  );
}
