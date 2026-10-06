import React, { useState } from 'react';
import './styles.less';
import { Divider } from 'rsuite';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Translate from '../Translate';

interface SectionContainerProps {
  title: React.ReactNode;
  content: React.ReactNode;
  action?: React.ReactNode;
  button?: React.ReactNode;
  minHeight?: string | number;
  maxWidth?: string | number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  content,
  action = null,
  button = null,
  minHeight,
  maxWidth,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const [collapsed, setCollapsed] = useState(
    collapsible ? defaultCollapsed : false
  );

  const handleToggle = () => {
    if (collapsible) {
      setCollapsed(prev => !prev);
    }
  };

  return (
    <div
      className={`container-form-section ${
        mode === 'dark' ? 'dark' : 'light'
      } ${collapsible ? 'collapsible' : ''} ${
        collapsed ? 'collapsed' : 'expanded'
      }`}
      style={{
        minHeight: collapsed ? 'auto' : minHeight ?? 'auto',
        maxWidth: maxWidth ?? '100%'
      }}
    >
      <div
        className="title-div"
        onClick={handleToggle}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={e => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleToggle();
          }
        }}
      >
        <Translate className="title-text">{title}</Translate>

        <div className="section-header-actions">
          {action && (
            <div
              className="title-action"
              onClick={e => e.stopPropagation()}
            >
              {action}
            </div>
          )}

          {collapsible && (
            <div className="collapse-icon">
              <FontAwesomeIcon icon={faChevronDown} />
            </div>
          )}
        </div>
      </div>

      <div className="collapsible-content">
        <div className="collapsible-content-inner">
          <Divider />

          <div className="section-content">{content}</div>

          {button && (
            <>
              <Divider />
              <div className="container-of-add-new-button-pre">
                {button}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionContainer;