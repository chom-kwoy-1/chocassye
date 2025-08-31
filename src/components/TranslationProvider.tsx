"use client";

import React, { createContext } from "react";

import { useTranslation as useTranslationClient } from "@/app/i18n/client";

export const TranslationContext = createContext<
  [string | undefined, (lng: string) => void]
>([undefined, (_: string) => {}]); // fallback value

export function TranslationProvider({
  children,
  defaultLng,
}: {
  children: React.ReactNode;
  defaultLng: string;
}) {
  const [lng, setLng] = React.useState<string>(defaultLng);
  return (
    <TranslationContext.Provider value={[lng, setLng]}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const [lng, _] = React.useContext(TranslationContext);
  return useTranslationClient(lng);
}
