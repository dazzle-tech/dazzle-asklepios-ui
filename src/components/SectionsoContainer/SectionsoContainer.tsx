import React from 'react';
import './styles.less';
import { Divider } from 'rsuite';
import { useSelector } from 'react-redux';

interface SectionContainerProps {
  title: React.ReactNode;
  content: React.ReactNode;
  button?: React.ReactNode;
  minHeight?: string | number;
  maxWidth?: string | number;
}

const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  content,
  button = null,
  minHeight,
  maxWidth
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div
      className={`container-form-section ${mode === 'dark' ? 'dark' : 'light'}`}
      style={{
        minHeight: minHeight ?? 'auto',
        maxWidth: maxWidth ?? 'none',
      }}
    >
      <div className={`title-div ${mode === 'dark' ? 'dark' : 'light'}`}>{title}</div>
      <Divider />
      {content}
      {button && (
        <>
          <Divider />
          <div className="container-of-add-new-button-pre">{button}</div>
        </>
      )}
    </div>
  );
};


export default SectionContainer;

