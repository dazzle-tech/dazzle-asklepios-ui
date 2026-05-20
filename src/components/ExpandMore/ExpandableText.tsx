import React, { useState, useRef, useEffect } from 'react';
import './style.less';

type Props = {
  text?: string;
  lines?: number;
  maxChars?: number;
};

const ExpandableText: React.FC<Props> = ({
  text = '',
  lines = 3,
  maxChars
}) => {
  const [expanded, setExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const useCharLimit = typeof maxChars === 'number' && maxChars > 0;

  useEffect(() => {
    if (!text) {
      setShouldShowButton(false);
      return;
    }
    if (useCharLimit) {
      setShouldShowButton(text.length > maxChars);
      return;
    }
    if (textRef.current) {
      const element = textRef.current;
      setShouldShowButton(element.scrollHeight > element.clientHeight);
    }
  }, [text, lines, maxChars, useCharLimit]);

  if (!text) return null;

  const displayText =
    useCharLimit && !expanded && text.length > (maxChars as number)
      ? `${text.substring(0, maxChars)}...`
      : text;

  return (
    <div className="expandable-text">
      <div
        ref={textRef}
        className={`expandable-text__content ${
          !useCharLimit && expanded ? 'expanded' : ''
        }`}
        style={
          !useCharLimit
            ? {
                WebkitLineClamp: expanded ? 'unset' : lines
              }
            : undefined
        }
      >
        {displayText}
      </div>

      {shouldShowButton && (
        <button
          type="button"
          className="expandable-text__button"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : 'Show More'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`expandable-text__icon ${expanded ? 'rotated' : ''}`}
          >
            <path
              d="M6 8L2.5 4.5L3.2 3.8L6 6.6L8.8 3.8L9.5 4.5L6 8Z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ExpandableText;