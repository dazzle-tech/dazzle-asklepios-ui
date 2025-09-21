import { useAppSelector } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import "./styles.less";
const Translate = props => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);
  const mode = useSelector((state: any) => state.ui.mode);
  const [text, setText] = useState('');

  useEffect(() => {
    if (props.children) {
      if (lang === 'en') {
        setText(props.children);
      } else {
        if (translations[props.children]) {
          setText(translations[props.children]);
        } else {
          setText(props.children);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (lang === 'en') {
      setText(props.children);
    } else {
      if (translations[props.children]) {
        setText(translations[props.children]);
      } else {
        setText(props.children);
      }
    }
  }, [lang, props.children]);

  return(
   <>{text}</>
  );
};

export default Translate;
