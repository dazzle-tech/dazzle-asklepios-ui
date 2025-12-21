import { useAppSelector } from '@/hooks';

export const useTranslate = () => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);

  const toKey = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\s+/g, '_')
      .toUpperCase();

  return (text: string) => {
    if (!text) return '';
    if (!lang) return text;

    return translations[lang]?.[toKey(text)] ?? text;
  };
};
