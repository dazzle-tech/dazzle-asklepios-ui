import React from 'react';
import './styles.less';
import { Divider, Form } from 'rsuite';
import { useSelector } from 'react-redux';
import Translate from '../Translate';

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

  return (
    <div
      className={`container-form-section ${mode === 'dark' ? 'dark' : 'light'}`}
      style={{
        minHeight: minHeight ?? 'auto',
        maxWidth: maxWidth ?? '100%'
      }}
    >
      {/* ===== Header ===== */}
      <Form className="title-div">
        <Translate className="title-text">{title}</Translate>
        {action && <div className="title-action">{action}</div>}
      </Form>

      <Divider />

      {/* ===== Content ===== */}
      <div className="section-content">{content}</div>

      {/* ===== Optional Button ===== */}
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