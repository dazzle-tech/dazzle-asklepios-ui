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
  return (
      <MyTab data={data} />
  );
};
export default OperationRoomMaterials;
