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

import React, { useEffect, useState, ReactElement } from 'react';
import { Tooltip, Whisper } from 'rsuite';
import Translate from '../Translate';
import { useSelector } from 'react-redux';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

interface TabDataItem {
  title: string;            
  content: ReactElement;     
}

interface MyTabProps {
  data: TabDataItem[];    
}

const MyTab: React.FC<MyTabProps> = ({ data }) => {
  

  if (!Array.isArray(data)) {
    return null;
  }

  return (
    <Tabs>
      <TabList>
        {data.map((item, index) => (
          <Tab key={index}>{item.title}</Tab>
        ))}
      </TabList>

      {data.map((item, index) => (
        <TabPanel key={index}>{item.content}</TabPanel>
      ))}
    </Tabs>
  );
};

export default MyTab;
