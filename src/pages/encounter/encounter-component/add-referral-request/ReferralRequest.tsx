import MyButton from '@/components/MyButton/MyButton';
import React, { useEffect, useState } from 'react';
import './styles.less';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import AddEditReferralRequest from './AddEditReferralRequest';
import PlusIcon from '@rsuite/icons/Plus';

const ReferralRequest = () => {
  const [referral, setReferral] = useState({ referralType: '' });
  const [openAddEditReferralPopup, setOpenAddEditReferralPopup] = useState<boolean>(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && referral && rowData.key === referral.key) {
      return 'selected-row';
    } else return '';
  };

  const data = [
    {
      key: '1',
      referralType: 'Internal',
      department: 'department1',
      referralReason: 'reason1',
      notes: 'notes1'
    },
    {
      key: '2',
      referralType: 'external',
      department: '',
      referralReason: 'reason2',
      notes: 'notes2'
    },
    {
      key: '3',
      referralType: 'Internal',
      department: 'department3',
      referralReason: 'reason3',
      notes: 'notes3'
    },
    {
      key: '4',
      referralType: 'external',
      department: '',
      referralReason: 'reason3',
      notes: 'notes3'
    }
  ];
  
  //table columns
  const tableColumns = [
    {
      key: 'referralType',
      title: <Translate>Referral Type</Translate>
    },
    {
      key: 'department',
      title: <Translate>Department</Translate>
    },
    {
      key: 'referralReason',
      title: <Translate>Referral Reason</Translate>
    },
    {
      key: 'notes',
      title: <Translate>Notes</Translate>
    }
  ];

  const handleNew = () => {
    setOpenAddEditReferralPopup(true);
    setReferral({ referralType: '' });
  };

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <div className="container-of-add-new-button">
        <MyButton color="var(--deep-blue)" prefixIcon={() => <PlusIcon />} onClick={handleNew} width="109px">
          Add New
        </MyButton>
      </div>
      <MyTable
        height={450}
        data={data}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setReferral(rowData);
        }}
      />
      <AddEditReferralRequest
        open={openAddEditReferralPopup}
        setOpen={setOpenAddEditReferralPopup}
        width={width}
        referral={referral}
        setReferral={setReferral}
      />
    </div>
  );
};
export default ReferralRequest;
