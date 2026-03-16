import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import './style.less';

interface CollapsibleSectionProps {
  title: string;
  icon: any;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  badge?: string | null;
  alwaysOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  color,
  isOpen,
  onToggle,
  children,
  disabled = false,
  badge = null,
  alwaysOpen = false
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div
      className={`collapsible-container ${isOpen ? 'open' : 'closed'} ${
        mode === 'light' ? 'collapsible-light' : 'collapsible-dark'
      }`}
      style={{
        borderColor: isOpen ? color : undefined,
        backgroundColor: isOpen ? `${color}08` : undefined
      }}
    >
      <div
        onClick={disabled || alwaysOpen ? undefined : onToggle}
        className={`collapsible-header ${
          disabled ? 'disabled' : disabled || alwaysOpen ? 'not-clickable' : 'clickable'
        } ${isOpen ? '' : 'closed'}`}
        style={{
          background: isOpen ? `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` : undefined
        }}
      >
        <div className="header-left">
          <FontAwesomeIcon
            icon={icon}
            className={`icon ${isOpen ? 'open' : 'closed'}`}
            style={{
              color: isOpen ? color : undefined
            }}
          />
          <span
            className={`title-1 ${isOpen ? 'open' : 'closed'}`}
            style={{
              color: isOpen ? color : undefined
            }}
          >
            {title}
          </span>
          {badge && (
            <span
              className="badge"
              style={{
                backgroundColor: color
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {!disabled && !alwaysOpen && (
          <FontAwesomeIcon
            icon={isOpen ? faChevronUp : faChevronDown}
            className={`chevron ${isOpen ? 'open' : 'closed'}`}
            style={{
              color: isOpen ? color : undefined
            }}
          />
        )}
      </div>

      <div className={`content-wrapper ${isOpen ? 'open' : 'closed'}`}>
        <div className={`content ${isOpen ? 'open' : 'closed'}`}>{children}</div>
      </div>
    </div>
  );
};

export default CollapsibleSection;
