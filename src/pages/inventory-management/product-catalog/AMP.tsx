import React, { useEffect, useState } from 'react';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FaSortAmountDownAlt, FaUndo } from 'react-icons/fa';
import MyModal from '@/components/MyModal/MyModal';
const AMP = ({ open, setOpen, selectedProduct }) => {
  const dispatch = useAppDispatch();
    //Table columns
    const tableColumns = [
      {
        key: 'productKey',
        title: <Translate>Warehouse Name</Translate>,
        flexGrow: 4,
   
      },
      {
        key: 'productType',
        title: <Translate>Amount</Translate>,
     
      },
      {
        key: 'productcode',
        title: <Translate>UOM</Translate>,
        flexGrow: 4,
     
      },
      {
        key: 'productUOM',
        title: <Translate>Patient</Translate>,
        flexGrow: 4,
     
      },
      {
        key: 'quantity',
        title: <Translate>Encounter</Translate>,
        flexGrow: 4,
      },
      {
        key: 'quantity',
        title: <Translate>Reservation Notes</Translate>,
        flexGrow: 4,
      }
    ];

const conjureFormContent = () => {
    return(
   <MyTable
          height={450}
          data={[]}
          columns={tableColumns}
       
      
        />
    );
}

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={'Amount to Promise'}
      hideActionBtn={true}
      content={conjureFormContent()}
      steps={[{ title: 'AMP Info', icon: <FaSortAmountDownAlt /> }]}
    />
  );
};
export default AMP;
