import { getRequestConfig } from 'next-intl/server';
 
// Can be imported from a shared config
const locales = ['en', 'ja'] as const;
 
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = locales[0];
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale
  };
});
