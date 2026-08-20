import { useAppSelector } from '@/hooks';
import React from 'react';
import "./styles.less";

const toKey = (s: string): string => {
  if (typeof s !== 'string') return s;
  return s.normalize('NFD').replace(/\s+/g, '_').toUpperCase();
};

const Translate = ({ children }: { children?: any }) => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);

  if (typeof children !== 'string') return <>{children}</>;

  const key = toKey(children);
  const translated =
    lang && translations[lang]?.static?.[key]
      ? translations[lang].static[key]
      : children;
  return <span className="translate-text">{translated}</span>;
};

export default Translate;
