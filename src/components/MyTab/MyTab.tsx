import React, { useEffect, useState } from 'react';
import { Tooltip, Whisper } from 'rsuite';
import Translate from '../Translate';
import { useSelector } from 'react-redux';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
const MyTab = ({data, ...props}) => {
  const [errorType, setErrorType] = useState(undefined);
  const mode = useSelector((state: any) => state.ui.mode);


  return (
   <Tabs>
    
   </Tabs>
  );
};

export default MyTab;
