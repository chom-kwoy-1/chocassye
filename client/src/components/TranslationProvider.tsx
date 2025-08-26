'use client';
import React, { createContext } from 'react';

export const TranslationContext = createContext('en');

export function TranslationProvider({ children }: {
  children: React.ReactNode,
}) {
  const [lng, setLng] = React.useState('en');
  return (
    <TranslationContext.Provider value={lng}>
      {children}
    </TranslationContext.Provider>
  );
}
