import { useAppSelector } from '@/hooks';
import React, { useEffect, useState } from 'react';
import "./styles.less";
const Translate = props => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);
 const toKey = (s: string) => {
  if (typeof s === 'string') {
  s = s.normalize('NFD');
  return s
    .replace(/\s+/g, '_')            // replace all spaces with underscores
    .toUpperCase();
} else {
  console.warn('Expected a string, got:', s);
  return s;
}
};

  const [text, setText] = useState('');
    useEffect(() => {
    if (props.children) {
      if (lang === '') {
        setText(props.children);
      } else {
        if (translations[lang]?.[toKey(props?.children)]) {
          setText(translations[lang][toKey(props?.children)]);
        } else {
          setText(props.children);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (props.children) {
      if (lang === '') {
        setText(props.children);
      } else {
        if (translations[lang]?.[toKey(props?.children)]) {
          setText(translations[lang][toKey(props.children)]);
        } else {
          setText(props.children);
        }
      }
    }
  }, [lang, props.children]);

  return(
   <>{text}</>
  );
};

export default Translate;
