import React from 'react';
import './styles.less';
import { Divider } from 'rsuite';
import { useSelector } from 'react-redux';

const SectionContainer = ({ title, content, button = null }) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div className={`container-form-section ${mode === 'dark' ? 'dark' : 'light'}`}>
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

