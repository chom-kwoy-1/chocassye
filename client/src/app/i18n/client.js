'use client'

import { useEffect, useState } from 'react';
import i18next from 'i18next';
import { initReactI18next, useTranslation as useTranslationOrg } from 'react-i18next';
import { getCookie, setCookie } from 'cookies-next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { getOptions, languages, cookieName } from './settings';

const runsOnServerSide = typeof window === 'undefined';


export function useTranslation(lng, ns, options) {
  if (!i18next.isInitialized) {
    i18next
      .use(initReactI18next)
      .use(resourcesToBackend((language, namespace) => import(`./locales/${language}/${namespace}.json`)))
      .init({
        ...getOptions(),
        lng: lng, // let detect the language on client side
        detection: {
          order: ['path', 'htmlTag', 'cookie', 'navigator'],
        },
        preload: runsOnServerSide ? languages : []
      });
    lng = i18n.resolvedLanguage;
  }
  const i18nextCookie = getCookie(cookieName);
  const ret = useTranslationOrg(ns, options);
  const { i18n } = ret;
  if (runsOnServerSide && lng && i18n.resolvedLanguage !== lng) {
    i18n.changeLanguage(lng);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [activeLng, setActiveLng] = useState(i18n.resolvedLanguage);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (activeLng === i18n.resolvedLanguage) return;
      setActiveLng(i18n.resolvedLanguage);
    }, [activeLng, i18n.resolvedLanguage]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!lng || i18n.resolvedLanguage === lng) return;
      i18n.changeLanguage(lng);
    }, [lng, i18n]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (i18nextCookie === lng) return;
      setCookie(cookieName, lng, { path: '/' });
    }, [lng, i18nextCookie]);
  }
  return ret;
}
