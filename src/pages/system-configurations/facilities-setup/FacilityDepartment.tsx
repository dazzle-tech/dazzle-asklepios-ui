import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';

const FacilityDepartment = ({ open, setOpen, departments, width }) => {
  // Table columns
  const tableColumns = [
    {
      key: 'name',
      title: <Translate>Department Name</Translate>,
      flexGrow: 4,
      dataKey: 'name'
    },
    {
      key: 'departmentTypeLkey',
      title: <Translate>Department Type</Translate>,
      flexGrow: 4,
      dataKey: 'departmentTypeLkey'
    }
  ];
  // Modal content
  const conjureFormContent = () => {
    return <MyTable height={300} data={departments ?? []} columns={tableColumns} />;
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={'Facility Departments'}
      position="right"
      content={<div dir={dir}>{conjureFormContent()}</div>}
      hideActionBtn
      hideBack
      hideCancel
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default FacilityDepartment;
