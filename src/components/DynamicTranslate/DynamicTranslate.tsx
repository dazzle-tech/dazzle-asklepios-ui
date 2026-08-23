import { useAppSelector } from '@/hooks';
import React from 'react';

interface DynamicTranslateProps {
  resourceKey: string;
  resourceType: string;
  fieldName: string;
  children?: React.ReactNode;
}

const DynamicTranslate = ({
  resourceKey,
  resourceType,
  fieldName,
  children,
}: DynamicTranslateProps) => {
  const lang = useAppSelector(state => state.ui.lang);
  const translations = useAppSelector(state => state.ui.translations);

  const translated =
    lang &&
    translations[lang]?.dynamic?.[resourceType]?.[resourceKey]?.[fieldName];

  return (
    <span className="translate-text">
      {translated ?? children}
    </span>
  );
};

export default DynamicTranslate;