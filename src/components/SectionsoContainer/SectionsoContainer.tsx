import React from 'react';
import './styles.less';
import { Divider } from 'rsuite';
const SectionContainer = ({ title, content }) => {
  return (
    <div className="container-form">
      <div className="title-div">{title}</div>
      <Divider />
      {content}
    </div>
  );
};
export default SectionContainer;
