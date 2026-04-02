//Declares
import React from 'react';
import Preparation from './Preparation';
import Reconciliation from './Reconciliation';
import MyTab from '@/components/MyTab';

const OperationRoomMaterials = () => {
  const data = [
    {title: "Preparation", content: <Preparation />},
    {title: "Reconciliation", content: <Reconciliation></Reconciliation>},
  ];

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
<MyTab
  data={data.map(tab => ({
    ...tab,
    content: <div dir={dir}>{tab.content}</div>
  }))}
  className="tab-container"
/>
  );
};
export default OperationRoomMaterials;
