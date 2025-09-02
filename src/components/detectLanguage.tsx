import { getCookie } from "cookies-next/server";
import { cookies, headers } from "next/headers";

import { useTranslation } from "@/app/i18n";
import { fallbackLng, languages } from "@/app/i18n/settings";

export async function detectLanguage() {
  // Determine the user's language preference from cookies or headers
  let lng = await getCookie("i18next", { cookies });
  if (lng === undefined || lng === "undefined") {
    const acceptLanguage = (await headers()).get("Accept-Language");
    lng = acceptLanguage?.split(",")[0]?.split("-")[0]; // Take the first language preference
  }
  if (lng === undefined || !languages.includes(lng)) {
    lng = fallbackLng; // default to English if no preference is found
  }
  return lng;
}

export async function getTranslation() {
  const lng = await detectLanguage();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useTranslation(lng);
}
