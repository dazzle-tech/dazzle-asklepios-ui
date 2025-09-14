import React from 'react';
import './styles.less';
import { Divider, Text } from 'rsuite';
import { useSelector } from 'react-redux';
const Section = ({ title, content, setOpen, rightLink, openedContent }) => {
    const mode = useSelector((state: any) => state.ui.mode);
  return (
    <div className={`medical-dashboard-main-container ${mode === 'light' ? 'light' : 'dark'}`}>
      <div className="medical-dashboard-container-div">
        <div className="medical-dashboard-header-div">
          <div className="medical-dashboard-title-div">{title}</div>
          <div className="bt-right">
            <Text onClick={() => setOpen(true)} className="clickable-link">
              {rightLink}
            </Text>
          </div>
        </div>
        <Divider className="divider-line" />
        <div style={{padding: "5px"}} className="medical-dashboard-table-div">{content}</div>
      </div>
      {openedContent}
    </div>
  );
};

export default Section;
