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
import { Tab, TabList, TabPanel } from 'react-tabs';

interface TabDataItem {
  title: string;
  content: ReactElement;
  disabled?: boolean
}

interface MyTabProps {
  data: TabDataItem[];
  defaultActiveKey?: string | number;
  appearance?: "subtle" | "tabs" | "pills";
  className?: string
}

const MyTab: React.FC<MyTabProps> = ({
  data,
  defaultActiveKey = '1',
  appearance = 'subtle',
  className = "nurse-tabs"
}) => {
  if (!Array.isArray(data)) {
    return null;
  }

  return (
    <Tabs
      defaultActiveKey={defaultActiveKey}
      appearance={appearance}
      className={`tabs-style ${className}`}
    >
      {data.map((item, index) => (
          <Tabs.Tab key={index} eventKey={(index + 1) + ""} title={<Translate>{item.title}</Translate>} disabled={item.disabled ? item.disabled : false}>
            {item.content}
          </Tabs.Tab>
        ))}
    </Tabs>
    // <Tabs>
    //   <TabList>
    //     {data.map((item, index) => (
    //       <Tab key={index}>{item.title}</Tab>
    //     ))}
    //   </TabList>

    //   {data.map((item, index) => (
    //     <TabPanel key={index}>{item.content}</TabPanel>
    //   ))}
    // </Tabs>
  );
};

export default MyTab;
