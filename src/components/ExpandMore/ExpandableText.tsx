import React, { useState, useRef, useEffect } from 'react';
import './style.less';

type Props = {
  text?: string;
  lines?: number;
};

const ExpandableText: React.FC<Props> = ({ text = '', lines = 3 }) => {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const element = textRef.current;
      setShouldShowButton(element.scrollHeight > element.clientHeight);
    }
  }, [text, lines]);

  if (!text) return null;

  return (
    <div className="expandable-text">
      <div
        ref={textRef}
        className={`expandable-text__content ${expanded ? 'expanded' : ''}`}
        style={{
          WebkitLineClamp: expanded ? 'unset' : lines
        }}
      >
        {text}
      </div>

      {shouldShowButton && (
        <button className="expandable-text__button" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less' : 'Show More'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`expandable-text__icon ${expanded ? 'rotated' : ''}`}
          >
            <path d="M6 8L2.5 4.5L3.2 3.8L6 6.6L8.8 3.8L9.5 4.5L6 8Z" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
