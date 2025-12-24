import React from 'react';
import './styles.less';
import { Divider } from 'rsuite';
import { useSelector } from 'react-redux';

interface SectionContainerProps {
  title: React.ReactNode;
  content: React.ReactNode;
  action?: React.ReactNode;
  button?: React.ReactNode;
  minHeight?: string | number;
  maxWidth?: string | number;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  content,
  action = null,
  button = null,
  minHeight,
  maxWidth
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const direction = useSelector(state => state.ui.direction);

  return (
    <div
      className={`container-form-section ${mode === 'dark' ? 'dark' : 'light'}`}
      style={{
        minHeight: minHeight ?? 'auto',
        maxWidth: maxWidth ?? '100%'
      }}
    >
      <div className="title-div flex-cen-between" style={{flexDirection: direction === "RTL" ? "row-reverse" : "row"}}>
        <div>{title}</div>
        {action && <div style={{flexDirection: direction === "RTL" ? "row-reverse" : "row"}}>{action}</div>}
      </div>

      <Divider />

      {/* ===== Content ===== */}
      <div className="section-content">
        {content}
      </div>

      {/* ===== Optional Button ===== */}
      {button && (
        <>
          <Divider />
          <div className="container-of-add-new-button-pre" style={{flexDirection: direction === "RTL" ? "row-reverse" : "row"}}>{button}</div>

        </>
      )}
    </div>
  );
};

export default SectionContainer;
