"use client";

import { useTranslation as useTranslationClient } from "@/app/i18n/client";
import React, { createContext } from "react";

export const TranslationContext = createContext<
  [string | undefined, (lng: string) => void]
>([undefined, (lng: string) => {}]); // fallback value

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
  const [lng, setLng] = React.useContext(TranslationContext);
  return useTranslationClient(lng);
}
