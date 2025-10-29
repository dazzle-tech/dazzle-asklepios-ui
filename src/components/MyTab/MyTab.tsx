// import React, { useEffect, useState } from 'react';
// import { Tooltip, Whisper } from 'rsuite';
// import Translate from '../Translate';
// import { useSelector } from 'react-redux';
// import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
// const MyTab = ({data, ...props}) => {
//   const [errorType, setErrorType] = useState(undefined);
//   const mode = useSelector((state: any) => state.ui.mode);

//   return (
//    <Tabs>

//    </Tabs>
//   );
// };

// export default MyTab;
import { Tabs } from 'rsuite';
import React, { ReactElement } from 'react';
import Translate from '../Translate';
import "./styles.less";

interface TabDataItem {
  title: string;
  content: ReactElement;
  disabled?: boolean
}

interface MyTabProps {
  data: TabDataItem[];
  defaultActiveKey?: string | number;
  appearance?: "subtle" | "tabs" | "pills";
  className?: string;
  activeTab?: string | number;
  setActiveTab?: (key: string | number) => void;
}

const MyTab: React.FC<MyTabProps> = ({
  data,
  defaultActiveKey = '1',
  appearance = 'subtle',
  className = "",
  activeTab,
  setActiveTab
}) => {

  if (!Array.isArray(data)) {
    return null;
  }

  const isControlled = activeTab !== undefined && typeof setActiveTab === 'function';

  return (
    <Tabs
      // defaultActiveKey={defaultActiveKey}
       {...(isControlled
        ? {
            activeKey: activeTab,
            onSelect: key => {
              if (key && setActiveTab) setActiveTab(key.toString());
            },
          }
        : {
            defaultActiveKey,
          })}
      appearance={appearance}
      className={`tabs-style ${className}`}
    >
      {data.map((item, index) => (
          <Tabs.Tab key={index} eventKey={(index + 1) + ""} title={<Translate>{item.title}</Translate>} disabled={item.disabled ? item.disabled : false}>
            {item.content}
          </Tabs.Tab>
        ))}
    </Tabs>
  );
};

export default MyTab;
